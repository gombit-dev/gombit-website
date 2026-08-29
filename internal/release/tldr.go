package release

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Summarizer turns raw GitHub release notes into a short, neutral "what's new"
// TL;DR shown on the releases page, via the xAI (Grok) chat completions API
// (OpenAI-compatible). The generated summary is a nicety layered over the
// always-authoritative release notes — if it is unavailable, the site falls
// back to the raw notes.
type Summarizer struct {
	apiKey  string
	baseURL string
	model   string
	client  *http.Client
}

// NewSummarizer builds a Summarizer from XAI_API_KEY (server-side only — never a
// VITE_* value). XAI_MODEL overrides the model (default "grok-3-mini") and
// XAI_BASE_URL the endpoint (default "https://api.x.ai/v1"). ok is false when no
// API key is configured, so the caller can skip summarization rather than fail
// ingestion.
func NewSummarizer() (*Summarizer, bool) {
	key := strings.TrimSpace(os.Getenv("XAI_API_KEY"))
	if key == "" {
		return nil, false
	}
	model := strings.TrimSpace(os.Getenv("XAI_MODEL"))
	if model == "" {
		model = "grok-3-mini"
	}
	baseURL := strings.TrimSpace(os.Getenv("XAI_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://api.x.ai/v1"
	}
	return &Summarizer{
		apiKey:  key,
		baseURL: strings.TrimRight(baseURL, "/"),
		model:   model,
		client:  &http.Client{Timeout: 45 * time.Second},
	}, true
}

const tldrSystem = `You summarize software release notes for a Go web framework's website.
Write a neutral, technical "what's new" TL;DR as 3 to 5 short bullet points.

Rules:
- One idea per bullet, each starting with "- ".
- Plain, concrete language for a developer audience. No marketing, no hype, no emoji.
- Describe what actually changed; omit boilerplate, contributor lists, and changelog links.
- Output only the bullet lines, nothing before or after.`

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatRequest struct {
	Model       string        `json:"model"`
	Messages    []chatMessage `json:"messages"`
	MaxTokens   int           `json:"max_tokens,omitempty"`
	Temperature float64       `json:"temperature"`
}

type chatResponse struct {
	Choices []struct {
		Message chatMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Summarize returns a short bullet-point TL;DR of the given release notes.
// name is the release title (for context); notes is the raw Markdown body.
func (s *Summarizer) Summarize(ctx context.Context, name, notes string) (string, error) {
	notes = strings.TrimSpace(notes)
	if notes == "" {
		return "", fmt.Errorf("release: empty notes")
	}

	payload, err := json.Marshal(chatRequest{
		Model: s.model,
		Messages: []chatMessage{
			{Role: "system", Content: tldrSystem},
			{Role: "user", Content: fmt.Sprintf("Release: %s\n\nRelease notes:\n%s", strings.TrimSpace(name), notes)},
		},
		MaxTokens:   2048,
		Temperature: 0.3,
	})
	if err != nil {
		return "", fmt.Errorf("release: marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.baseURL+"/chat/completions", bytes.NewReader(payload))
	if err != nil {
		return "", fmt.Errorf("release: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("release: summarize request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("release: xai status %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}

	var parsed chatResponse
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("release: decode response: %w", err)
	}
	if parsed.Error != nil {
		return "", fmt.Errorf("release: xai error: %s", parsed.Error.Message)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("release: no choices in response")
	}
	out := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if out == "" {
		return "", fmt.Errorf("release: empty summary")
	}
	return out, nil
}
