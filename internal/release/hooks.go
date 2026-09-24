package release

import (
	"context"

	"github.com/gombit-dev/gombit/contract"
)

// Hooks implements ReleaseHooks. This file is generated once and
// is yours to edit: set server-managed columns (tenant, owner, timestamps not
// handled by GORM, …) on row in BeforeCreate. Regeneration does not overwrite it.
type Hooks struct{}

// BeforeCreate refuses every create. Releases are ingested only by the GitHub
// webhook and edited through the admin; the generated Register (which mounts
// create-release) is intentionally not mounted — see RegisterPublic. Every
// field is server-set, so this is defense in depth should it ever be mounted.
func (Hooks) BeforeCreate(ctx context.Context, row *Release, body releaseCreateBody) error {
	return contract.WithContext(ctx, contract.MethodNotAllowed("releases are created by the GitHub webhook"))
}
