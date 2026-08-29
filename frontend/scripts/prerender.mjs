// Inject the build-time-rendered landing markup into the built index.html so
// the initial response is not an empty #root. Runs after `vite build` (client)
// and `vite build --ssr` (server bundle) in the frontend `build` script.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = resolve(root, "dist/index.html");
const serverEntry = resolve(root, "dist-server/entry-server.js");

const { render } = await import(serverEntry);
const template = readFileSync(indexPath, "utf-8");

const marker = '<div id="root"></div>';
if (!template.includes(marker)) {
  throw new Error(`prerender: '${marker}' not found in dist/index.html`);
}

const html = template.replace(marker, `<div id="root">${render()}</div>`);
writeFileSync(indexPath, html);
rmSync(resolve(root, "dist-server"), { recursive: true, force: true });

console.log("prerender: wrote landing markup into dist/index.html");
