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

// Production builds prerender one route into #root (scripts/prerender.mjs), but
// the embedded server returns that same index.html for every SPA route. Hydrate
// only when the prerendered route matches the current path; otherwise the markup
// is for a different page, so replace it with a fresh client render (also the
// `gombit dev` path, where #root is empty).
if (root.getAttribute("data-prerender") === window.location.pathname) {
  hydrateRoot(root, app);
} else {
  root.textContent = "";
  createRoot(root).render(app);
}
