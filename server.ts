import fs from "node:fs/promises";
import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import {
  isAllowedReferrer,
  EMPTY_COMPOSITION,
  IN_CONTEXT_EDITOR_CONFIG_CHECK_QUERY_STRING_PARAM,
  type RootComponentInstance,
} from "@uniformdev/canvas";
import type { ViteDevServer } from "vite";

import { getComposition } from "./src/uniform/api";

type RenderResult = {
  html?: string;
  head?: string;
  dataScript?: string;
};

type RenderFn = (props: { composition?: RootComponentInstance }) => Promise<RenderResult>;

// CSS is imported from JS modules, so in development Vite serves it as JS that
// injects <style> tags only after the client bundle runs -- causing a flash of
// unstyled content (FOUC). We walk the client entry's module graph, find its
// CSS, and inject real stylesheet links into the SSR <head> so styles are
// present on first paint. Requesting a CSS module with `?direct` makes Vite
// return raw text/css instead of the JS wrapper. In production this isn't
// needed: `vite build` already emits <link> tags into the HTML template.
const CSS_LANG_RE = /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
const CLIENT_ENTRY = "/src/entry-client.tsx";

async function collectDevCssLinks(server: ViteDevServer, entry: string): Promise<string> {
  const cssUrls = new Set<string>();
  const visited = new Set<string>();

  const traverse = async (url: string): Promise<void> => {
    if (visited.has(url)) return;
    visited.add(url);
    // Transform the module first so its imports are registered in the graph.
    try {
      await server.transformRequest(url);
    } catch {
      return;
    }
    const mod = await server.moduleGraph.getModuleByUrl(url, false);
    if (!mod) return;
    if (CSS_LANG_RE.test(mod.url)) {
      cssUrls.add(mod.url);
      return;
    }
    await Promise.all([...mod.importedModules].map((m) => traverse(m.url)));
  };

  await traverse(entry);

  return [...cssUrls]
    .map((u) => `<link rel="stylesheet" href="${u}${u.includes("?") ? "&" : "?"}direct">`)
    .join("\n    ");
}

// For now, we will use the same path we use to render composition.
// But it's recommended to have a dedicated route for the playground and use <UniformPlayground />
const PLAYGROUND_PATH = "/";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 5173;
const base = process.env.BASE || "/";

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/client/index.html", "utf-8") : "";

// Create http server
const app: Express = express();
app.use(cors());

// Add Vite or respective production middlewares
let vite: ViteDevServer | undefined;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

// Serve HTML
app.use("*", async (req: Request, res: Response) => {
  try {
    const url = req.originalUrl.replace(base, "");
    let template: string;
    let render: RenderFn;
    let devCssLinks = "";
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite!.transformIndexHtml(url, template);
      devCssLinks = await collectDevCssLinks(vite!, CLIENT_ENTRY);
      render = (await vite!.ssrLoadModule("/src/entry-server.tsx")).render;
    } else {
      template = templateHtml;
      // Resolved at runtime from the production build output, which does not
      // exist at type-check time, so avoid a static module specifier here.
      const entryServerPath = "./dist/server/entry-server.js";
      render = (await import(entryServerPath)).render;
    }

    const isConfigCheck = req.query[IN_CONTEXT_EDITOR_CONFIG_CHECK_QUERY_STRING_PARAM] === "true";
    if (isConfigCheck) {
      res.json({
        hasPlayground: Boolean(PLAYGROUND_PATH),
      });
      return;
    }

    const path = req.params[0];
    let composition: RootComponentInstance;

    if (path === "/api/preview" && isAllowedReferrer(req.headers.referer)) {
      // In preview mode, there is no need to spent time fetching the composition
      // we will get it from Canvas editor on the client-side. We just use a stub composition
      composition = EMPTY_COMPOSITION;
      // TODO: check if the preview secret is correct before moving forward
    } else {
      composition = await getComposition(path);
    }

    const rendered = await render({ composition });

    const html = template
      .replace(`<!--app-head-->`, devCssLinks + (rendered.head ?? ""))
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`<!--app-data-->`, rendered.dataScript ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    const error = e as Error;
    vite?.ssrFixStacktrace(error);
    console.log(error.stack);
    res.status(500).end(error.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
