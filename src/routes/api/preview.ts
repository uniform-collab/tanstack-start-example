import { createFileRoute } from "@tanstack/react-router";
import { SECRET_QUERY_STRING_PARAM } from "@uniformdev/canvas";
import { enablePreview, exitPreview } from "../../uniform/preview";

// Uniform's "Preview URL" points the Canvas editor at this endpoint, e.g.
//   /api/preview?secret=<SECRET>&path=%2Fabout&slug=about&is_incontext_editing_mode=true
// We validate the shared secret, seal a preview cookie, then 302 to the target
// page. That page's loader sees the cookie and fetches draft content.
//
// To leave preview mode, hit /api/preview?exit=true (clears the cookie).

// Params that drive this endpoint and shouldn't be forwarded to the page.
const CONTROL_PARAMS = new Set([SECRET_QUERY_STRING_PARAM, "path", "slug", "exit"]);

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

// Build "/about?locale=...&is_incontext_editing_mode=true": keep the editor's
// context params (everything except CONTROL_PARAMS) so editing stays active
// after the redirect.
function buildDestination(url: URL): string {
  const dest = toLocalPath(
    url.searchParams.get("path") ?? url.searchParams.get("slug")
  );
  const forwarded = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (!CONTROL_PARAMS.has(key)) forwarded.set(key, value);
  }
  const query = forwarded.toString();
  return query ? `${dest}?${query}` : dest;
}

export const Route = createFileRoute("/api/preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        if (url.searchParams.get("exit") === "true") {
          await exitPreview();
          return redirect(toLocalPath(url.searchParams.get("path")));
        }

        const secret = url.searchParams.get(SECRET_QUERY_STRING_PARAM);
        if (!secret || secret !== process.env.UNIFORM_PREVIEW_SECRET) {
          return new Response("Invalid preview secret.", { status: 401 });
        }

        await enablePreview();
        return redirect(buildDestination(url));
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
