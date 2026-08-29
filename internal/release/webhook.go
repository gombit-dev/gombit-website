package release

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/danielgtaylor/huma/v2"
	"github.com/gombit-dev/gombit/contract"
	"github.com/gombit-dev/gombit/framework"
	"gorm.io/gorm"
)

// TL;DR generation lifecycle stored on Release.TldrStatus.
const (
	TldrPending = "pending"
	TldrReady   = "ready"
	TldrFailed  = "failed"
)

// WebhookHandler ingests GitHub release webhooks into the Release table and
// kicks off AI TL;DR generation. This is the marquee reason the site has a
// database: it is write-driven and event-driven (DESIGN.md §6a).
type WebhookHandler struct {
	DB         *gorm.DB
	Summarizer *Summarizer // nil when XAI_API_KEY is unset; TL;DR is skipped.
}

// RegisterWebhook mounts the GitHub release webhook. Call it from main after
// release.Register(app).
func RegisterWebhook(app *framework.App) {
	h := &WebhookHandler{DB: app.DB()}
	if s, ok := NewSummarizer(); ok {
		h.Summarizer = s
	}
	huma.Register(app.API(), huma.Operation{
		OperationID: "github-release-webhook",
		Method:      http.MethodPost,
		Path:        app.Config().API.Prefix + "/webhooks/github",
		Summary:     "GitHub release webhook",
		Description: "Verifies the GitHub HMAC signature and ingests release events into the Release table.",
		Tags:        []string{"Webhooks"},
	}, h.handle)
}

type githubWebhookInput struct {
	Event     string `header:"X-GitHub-Event" doc:"GitHub event name"`
	Signature string `header:"X-Hub-Signature-256" doc:"HMAC-SHA256 signature of the raw body"`
	RawBody   []byte
}

type webhookAck struct {
	Received bool   `json:"received" doc:"Whether the event was accepted"`
	Tag      string `json:"tag,omitempty" doc:"Ingested release tag, if any"`
	Status   string `json:"status,omitempty" doc:"Ingestion outcome"`
}

type githubWebhookOutput struct {
	Body contract.Data[webhookAck]
}

// githubReleasePayload is the subset of the GitHub `release` event we store.
type githubReleasePayload struct {
	Action  string `json:"action"`
	Release struct {
		TagName     string `json:"tag_name"`
		Name        string `json:"name"`
		Body        string `json:"body"`
		HTMLURL     string `json:"html_url"`
		PublishedAt string `json:"published_at"`
	} `json:"release"`
}

func (h *WebhookHandler) handle(ctx context.Context, in *githubWebhookInput) (*githubWebhookOutput, error) {
	secret := strings.TrimSpace(os.Getenv("GOMBIT_GITHUB_WEBHOOK_SECRET"))
	if secret == "" {
		return nil, huma.Error503ServiceUnavailable("release webhook is not configured")
	}
	// Verify the signature against the exact bytes GitHub signed, before
	// parsing anything.
	if !validSignature(secret, in.RawBody, in.Signature) {
		return nil, huma.Error401Unauthorized("invalid signature")
	}
	// Only release events carry a release payload; ack everything else.
	if in.Event != "release" {
		return ack(webhookAck{Received: true}), nil
	}

	var payload githubReleasePayload
	if err := json.Unmarshal(in.RawBody, &payload); err != nil {
		return nil, huma.Error400BadRequest("invalid release payload")
	}
	// Ingest only published/edited/released actions; ack the rest.
	switch payload.Action {
	case "published", "edited", "released":
	default:
		return ack(webhookAck{Received: true, Status: "ignored"}), nil
	}
	rel := payload.Release
	if rel.TagName == "" {
		return nil, huma.Error400BadRequest("release payload missing tag_name")
	}

	// Upsert idempotently on the unique tag: re-deliveries and edits update the
	// same row rather than duplicating it, and reset the TL;DR to pending so an
	// edited body is re-summarized.
	var row Release
	err := h.DB.WithContext(ctx).Where("tag = ?", rel.TagName).First(&row).Error
	row.Tag = rel.TagName
	row.Name = rel.Name
	row.Body = rel.Body
	row.Url = rel.HTMLURL
	row.PublishedAt = rel.PublishedAt
	row.TldrStatus = TldrPending
	if err == nil {
		err = h.DB.WithContext(ctx).Save(&row).Error
	} else {
		err = h.DB.WithContext(ctx).Create(&row).Error
	}
	if err != nil {
		return nil, contract.WithContext(ctx, contract.Internal("ingest release"))
	}

	// Summarize out of the request path so a slow/failing AI call never makes
	// GitHub's delivery time out. v0.1 has no job queue (an M6 battery we don't
	// pull in), so a short-lived goroutine is the in-scope version; the raw
	// notes remain the authoritative fallback if it never completes.
	if h.Summarizer != nil {
		go h.generateTLDR(row.Tag, row.Name, row.Body)
	}

	return ack(webhookAck{Received: true, Tag: row.Tag, Status: "ingested"}), nil
}

// generateTLDR summarizes a release out-of-band and records the result. It uses
// a fresh context because the request context is canceled once handle returns.
func (h *WebhookHandler) generateTLDR(tag, name, body string) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	tldr, err := h.Summarizer.Summarize(ctx, name, body)
	status := TldrReady
	if err != nil {
		tldr, status = "", TldrFailed
	}
	h.DB.Model(&Release{}).Where("tag = ?", tag).
		Updates(map[string]any{"tldr": tldr, "tldr_status": status})
}

func ack(body webhookAck) *githubWebhookOutput {
	return &githubWebhookOutput{Body: contract.Data[webhookAck]{Data: body}}
}

// validSignature reports whether sigHeader ("sha256=<hex>") is a valid
// HMAC-SHA256 of body under secret, in constant time.
func validSignature(secret string, body []byte, sigHeader string) bool {
	const prefix = "sha256="
	if !strings.HasPrefix(sigHeader, prefix) {
		return false
	}
	want, err := hex.DecodeString(strings.TrimPrefix(sigHeader, prefix))
	if err != nil {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(body)
	return hmac.Equal(want, mac.Sum(nil))
}
