package release

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestSummarizerParsesXAIResponse(t *testing.T) {
	var gotAuth, gotModel, gotPath string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		gotPath = r.URL.Path
		var req chatRequest
		_ = json.NewDecoder(r.Body).Decode(&req)
		gotModel = req.Model
		_, _ = w.Write([]byte(`{"choices":[{"message":{"role":"assistant","content":"- one\n- two\n- three"}}]}`))
	}))
	defer srv.Close()

	t.Setenv("XAI_API_KEY", "test-key")
	t.Setenv("XAI_MODEL", "grok-test")
	t.Setenv("XAI_BASE_URL", srv.URL)

	s, ok := NewSummarizer()
	if !ok {
		t.Fatal("NewSummarizer: expected enabled with a key")
	}
	out, err := s.Summarize(context.Background(), "v1.0.0", "some release notes")
	if err != nil {
		t.Fatalf("Summarize() error = %v", err)
	}
	if out != "- one\n- two\n- three" {
		t.Fatalf("summary = %q", out)
	}
	if gotAuth != "Bearer test-key" {
		t.Fatalf("Authorization = %q, want Bearer test-key", gotAuth)
	}
	if gotModel != "grok-test" {
		t.Fatalf("model = %q, want grok-test", gotModel)
	}
	if gotPath != "/chat/completions" {
		t.Fatalf("path = %q, want /chat/completions", gotPath)
	}
}

func TestNewSummarizerDisabledWithoutKey(t *testing.T) {
	t.Setenv("XAI_API_KEY", "")
	if _, ok := NewSummarizer(); ok {
		t.Fatal("NewSummarizer: expected disabled without XAI_API_KEY")
	}
}

func TestSummarizerErrorsOnNon200(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = w.Write([]byte(`{"error":{"message":"invalid api key"}}`))
	}))
	defer srv.Close()

	t.Setenv("XAI_API_KEY", "k")
	t.Setenv("XAI_BASE_URL", srv.URL)
	s, _ := NewSummarizer()
	if _, err := s.Summarize(context.Background(), "v1", "notes"); err == nil {
		t.Fatal("Summarize() expected an error on HTTP 401")
	}
}
