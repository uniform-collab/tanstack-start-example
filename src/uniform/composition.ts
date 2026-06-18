import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { EMPTY_COMPOSITION, isAllowedReferrer } from "@uniformdev/canvas";
import { getComposition } from "./api";

// The single, server-only entry point for fetching a composition. Route loaders
// call this; TanStack Start runs it on the server for the initial request and
// via RPC during client-side navigation, so the Uniform API key never reaches
// the browser.
export const fetchComposition = createServerFn({ method: "GET" })
  .validator((path: string) => path)
  // Return type is `any`: a Uniform composition is plain JSON and serializes
  // fine, but its `value?: unknown` fields trip TanStack's compile-time
  // serialization guard. Loaders re-type the result as RootComponentInstance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data: path }): Promise<any> => {
    // In preview mode we don't need to spend time fetching the composition --
    // the Canvas editor provides it on the client. Return a stub when allowed.
    if (path === "/api/preview" && isAllowedReferrer(getRequestHeader("referer"))) {
      return EMPTY_COMPOSITION;
    }

    return getComposition(path);
  });
