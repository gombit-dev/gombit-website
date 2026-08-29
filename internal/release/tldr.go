package release

import (
	"context"
	"fmt"
	"os"
	"strings"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// Summarizer turns raw GitHub release notes into a short, neutral "what's new"
// TL;DR shown on the releases page. It is a thin wrapper over the Anthropic
// Messages API. The generated summary is a nicety layered over the always-
// authoritative release notes — if it is unavailable, the site falls back to
// the raw notes.
type Summarizer struct {
	client anthropic.Client
	model  anthropic.Model
}

// NewSummarizer builds a Summarizer from ANTHROPIC_API_KEY (server-side only —
// never a VITE_* value). ANTHROPIC_MODEL overrides the model; it defaults to
// Claude Haiku 4.5, the small/fast model chosen for this low-volume
// summarization in DESIGN.md §6a. ok is false when no API key is configured,
// so the caller can skip summarization rather than fail ingestion.
func NewSummarizer() (*Summarizer, bool) {
	key := strings.TrimSpace(os.Getenv("ANTHROPIC_API_KEY"))
	if key == "" {
		return nil, false
	}
	model := anthropic.Model(strings.TrimSpace(os.Getenv("ANTHROPIC_MODEL")))
	if model == "" {
		model = "claude-haiku-4-5"
	}
	return &Summarizer{client: anthropic.NewClient(option.WithAPIKey(key)), model: model}, true
}

const tldrSystem = `You summarize software release notes for a Go web framework's website.
Write a neutral, technical "what's new" TL;DR as 3 to 5 short bullet points.

Rules:
- One idea per bullet, each starting with "- ".
- Plain, concrete language for a developer audience. No marketing, no hype, no emoji.
- Describe what actually changed; omit boilerplate, contributor lists, and changelog links.
- Output only the bullet lines, nothing before or after.`

// Summarize returns a short bullet-point TL;DR of the given release notes.
// name is the release title (for context); notes is the raw Markdown body.
func (s *Summarizer) Summarize(ctx context.Context, name, notes string) (string, error) {
	notes = strings.TrimSpace(notes)
	if notes == "" {
		return "", fmt.Errorf("release: empty notes")
	}
	prompt := fmt.Sprintf("Release: %s\n\nRelease notes:\n%s", strings.TrimSpace(name), notes)

	resp, err := s.client.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     s.model,
		MaxTokens: 1024,
		System:    []anthropic.TextBlockParam{{Text: tldrSystem}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(prompt)),
		},
	})
	if err != nil {
		return "", fmt.Errorf("release: summarize: %w", err)
	}

	var b strings.Builder
	for _, block := range resp.Content {
		if text, ok := block.AsAny().(anthropic.TextBlock); ok {
			b.WriteString(text.Text)
		}
	}
	out := strings.TrimSpace(b.String())
	if out == "" {
		return "", fmt.Errorf("release: empty summary")
	}
	return out, nil
}
