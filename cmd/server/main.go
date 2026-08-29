package main

import (
	"context"
	"log"

	"github.com/gombit-dev/gombit/config"
	"github.com/gombit-dev/gombit/framework"

	"github.com/gombit-dev/gombit-website/internal/platform"
	"github.com/gombit-dev/gombit-website/internal/product"
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

	if err := framework.Run(app); err != nil {
		log.Fatal(err)
	}
}
