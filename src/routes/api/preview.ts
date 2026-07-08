import { createFileRoute } from "@tanstack/react-router";
import {
  SECRET_QUERY_STRING_PARAM,
  IN_CONTEXT_EDITOR_PLAYGROUND_QUERY_STRING_PARAM,
  IN_CONTEXT_EDITOR_CONFIG_CHECK_QUERY_STRING_PARAM,
} from "@uniformdev/canvas";
import { enablePreview, exitPreview } from "../../uniform/preview";

// Uniform's "Preview URL" points the Canvas editor at this endpoint, e.g.
//   /api/preview?secret=<SECRET>&path=%2Fabout&slug=about&is_incontext_editing_mode=true
// We validate the shared secret, seal a preview cookie, then 302 to the target
// page. That page's loader sees the cookie and fetches draft content.
//
// Component/pattern previews are different: they have no composition path, so
// the editor sends `is_incontext_editing_playground=true` and we redirect to a
// dedicated playground route that live-renders whatever the editor pushes.
//
// To leave preview mode, hit /api/preview?exit=true (clears the cookie).

// Route that live-previews components and patterns (see routes/playground.tsx).
const PLAYGROUND_PATH = "/playground";

// Params that drive this endpoint and shouldn't be forwarded to the page.
const CONTROL_PARAMS = new Set([
  SECRET_QUERY_STRING_PARAM,
  IN_CONTEXT_EDITOR_CONFIG_CHECK_QUERY_STRING_PARAM,
  "path",
  "slug",
  "exit",
]);

// Resolve the destination pathname. Uniform sends `path` (URL-encoded, e.g.
// %2Fabout) and `slug` (no leading slash, e.g. about); prefer `path`, fall back
// to `slug`. Leading slashes/backslashes are collapsed to a single "/" so a
// bare slug becomes "/about" and inputs like "//evil.com" or a "scheme:" can't
// turn this into an open redirect.
function toLocalPath(input: string | null): string {
  if (!input) return "/";
  if (/^[a-z][a-z0-9+.-]*:/i.test(input)) return "/";
  return "/" + input.replace(/^[/\\]+/, "");
}

// Append the editor's context params (everything except CONTROL_PARAMS) to the
// destination so contextual editing / playground state survives the redirect.
function withForwardedParams(basePath: string, url: URL): string {
  const forwarded = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (!CONTROL_PARAMS.has(key)) forwarded.set(key, value);
  }
  const query = forwarded.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export const Route = createFileRoute("/api/preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const params = url.searchParams;

        // Capability probe: the editor asks (before opening) whether we expose a
        // playground / custom routing. No secret required -- it returns no content.
        if (params.get(IN_CONTEXT_EDITOR_CONFIG_CHECK_QUERY_STRING_PARAM) === "true") {
          return json({ hasPlayground: true, isUsingCustomFullPathResolver: false });
        }

        if (params.get("exit") === "true") {
          await exitPreview();
          return redirect(toLocalPath(params.get("path")));
        }

        const secret = params.get(SECRET_QUERY_STRING_PARAM);
        if (!secret || secret !== process.env.UNIFORM_PREVIEW_SECRET) {
          return new Response("Invalid preview secret.", { status: 401 });
        }

        await enablePreview();

        // Component/pattern preview -> playground route (no composition path).
        if (params.get(IN_CONTEXT_EDITOR_PLAYGROUND_QUERY_STRING_PARAM) === "true") {
          return redirect(withForwardedParams(PLAYGROUND_PATH, url));
        }

        // Regular page preview -> the resolved composition path.
        const dest = toLocalPath(params.get("path") ?? params.get("slug"));
        return redirect(withForwardedParams(dest, url));
      },
    },
  },
});

// The session cookie is written to the request's response context by
// session.update()/clear(); returning a fresh 302 Response here still carries
// that Set-Cookie because Start merges context cookies into the final response.
function redirect(location: string): Response {
  return new Response(null, { status: 302, headers: { location } });
}

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
  });
}
