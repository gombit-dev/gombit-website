package release

import (
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/gombit-dev/gombit/framework"
)

// RegisterPublic mounts the read-only release API (list + get). Releases are
// created only by the GitHub webhook (RegisterWebhook) and edited through the
// runtime admin, so the generated public create route (release.Register) is
// intentionally not mounted — there is no unauthenticated write path.
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
