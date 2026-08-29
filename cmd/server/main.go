package main

import (
	"context"
	"log"

	"github.com/gombit-dev/gombit/admin"
	"github.com/gombit-dev/gombit/config"
	"github.com/gombit-dev/gombit/framework"

	"github.com/gombit-dev/gombit-website/internal/platform"
	"github.com/gombit-dev/gombit-website/internal/product"
	"github.com/gombit-dev/gombit-website/internal/release"
	"github.com/gombit-dev/gombit-website/internal/web"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	db, err := platform.OpenDatabase(cfg.Database)
	if err != nil {
		log.Fatal(err)
	}

	app, err := framework.New(
		framework.WithConfig(cfg),
		framework.WithDatabase(db),
		framework.WithEmbeddedFrontend(web.FS()),
		// The GitHub webhook is a server-to-server POST that can't carry a
		// double-submit CSRF token; it authenticates via HMAC signature.
		framework.WithCSRFExemptPaths(cfg.API.Prefix+"/webhooks/github"),
	)
	if err != nil {
		_ = db.Close()
		log.Fatal(err)
	}

	app.OnStart(func(ctx context.Context) error {
		return platform.AutoMigrate(db)
	})
	app.OnStop(func(context.Context) error {
		return db.Close()
	})

	product.Register(app)
	// Read-only release API; ingestion is via the webhook, editing via admin.
	release.RegisterPublic(app)
	release.RegisterWebhook(app)

	// Manage releases (and their AI TL;DRs) through the runtime admin.
	if err := admin.Register(app, release.Release{}, admin.Options{
		Slug:     "releases",
		List:     []string{"tag", "name", "published_at", "tldr_status"},
		Search:   []string{"tag", "name"},
		Ordering: []string{"published_at", "created_at"},
	}); err != nil {
		log.Fatal(err)
	}

	if err := framework.Run(app); err != nil {
		log.Fatal(err)
	}
}
