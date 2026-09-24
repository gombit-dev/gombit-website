package release

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/gombit-dev/gombit/framework"
)

// RegisterPublic mounts the read-only release API (list + get). Releases are
// created only by the GitHub webhook (RegisterWebhook) and edited through the
// runtime admin, so the generated Register (handler.gen.go), which also mounts
// create-release, is intentionally not called — there is no unauthenticated
// write path. This reuses the generated list/get methods, so the public contract
// stays model-first; Hooks is left unset because create is never mounted.
func RegisterPublic(app *framework.App) {
	h := &Handler{DB: app.DB()}
	prefix := app.Config().API.Prefix
	api := app.API()

	huma.Register(api, huma.Operation{
		OperationID: "list-releases",
		Method:      http.MethodGet,
		Path:        prefix + "/releases",
		Summary:     "List releases",
		Tags:        []string{"Releases"},
	}, h.list)

	huma.Register(api, huma.Operation{
		OperationID: "get-release",
		Method:      http.MethodGet,
		Path:        prefix + "/releases/{id}",
		Summary:     "Get a release",
		Tags:        []string{"Releases"},
	}, h.get)
}
