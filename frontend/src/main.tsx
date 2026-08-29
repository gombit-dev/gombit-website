import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";

import { AppProviders } from "./app/providers";
import { AppRouter } from "./app/router";

const root = document.querySelector("#root");
if (!(root instanceof HTMLElement)) {
  throw new Error("missing #root");
}

const app = (
  <StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </StrictMode>
);

// Production builds prerender the landing route into #root (scripts/prerender.mjs),
// so hydrate when there is server markup; otherwise (e.g. `gombit dev`) mount fresh.
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
