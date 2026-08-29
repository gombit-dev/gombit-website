import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { RequireAuth } from "../auth/RequireAuth";
import { AppLayout } from "../layouts/AppLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { ProductFormPage } from "../pages/ProductFormPage";
import { ProductListPage } from "../pages/ProductListPage";
import { generatedResourceRoutes } from "../resources";

// The docs subsystem (markdown renderer + synced content) is code-split so it
// never weighs down the landing bundle.
const DocsLayout = lazy(() => import("../pages/DocsLayout").then((m) => ({ default: m.DocsLayout })));
const DocsIndex = lazy(() => import("../pages/DocsIndex").then((m) => ({ default: m.DocsIndex })));
const DocsPage = lazy(() => import("../pages/DocsPage").then((m) => ({ default: m.DocsPage })));

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing site. */}
        <Route index element={<LandingPage />} />
        <Route
          path="guide"
          element={
            <Suspense fallback={null}>
              <DocsLayout />
            </Suspense>
          }
        >
          <Route index element={<DocsIndex />} />
          <Route path=":slug" element={<DocsPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        {/* Authenticated app surface (example CRUD, behind session auth). */}
        <Route element={<RequireAuth />}>
          <Route path="app" element={<AppLayout />}>
            <Route index element={<ProductListPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            {generatedResourceRoutes.map((route) => (
              <Route key={String(route.path)} path={route.path} element={route.element} />
            ))}
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
