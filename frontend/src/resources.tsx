// Generated-resource registry.
//
// gombit make resource appends list + create-form pages here. The Release
// resource's generated CRUD scaffold was removed on purpose: releases are
// shown by the bespoke ReleasesSection on the landing page, ingested by the
// GitHub webhook, and edited through the runtime admin — there is no public
// create screen. Leaving these arrays empty keeps the router/layout wiring in
// place for future resources.

import type { RouteObject } from "react-router";

export type GeneratedResource = {
  slug: string;
  title: string;
  listPath: string;
  createPath: string;
};

export const generatedResources: GeneratedResource[] = [];

export const generatedResourceRoutes: RouteObject[] = [];
