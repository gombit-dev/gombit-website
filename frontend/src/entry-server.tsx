import { renderToString } from "react-dom/server";

import { ApiClientContext, type ApiClient } from "./api/client";
import { LandingPage } from "./pages/LandingPage";

/**
 * Build-time prerender of the landing route to static HTML (scripts/prerender.mjs).
 * The initial response then carries the real hero, copy, and features — good
 * for SEO (crawlers that don't run JS) and first paint — and the client
 * hydrates it into the full SPA.
 *
 * ReleasesSection needs an ApiClientContext but only touches the client inside
 * an effect, which does not run during static rendering, so a stub is enough:
 * the release list renders its loading state here and fills in on the client.
 * The markup must match the client's first render at "/" (LandingPage with the
 * releases section still loading) for hydration to line up.
 */
export function render(): string {
  return renderToString(
    <ApiClientContext.Provider value={{} as ApiClient}>
      <LandingPage />
    </ApiClientContext.Provider>,
  );
}
