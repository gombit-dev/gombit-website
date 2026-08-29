import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { RequireAuth } from "../auth/RequireAuth";
import { AppLayout } from "../layouts/AppLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { ProductFormPage } from "../pages/ProductFormPage";
import { ProductListPage } from "../pages/ProductListPage";
import { generatedResourceRoutes } from "../resources";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public marketing site. */}
        <Route index element={<LandingPage />} />
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
