import { createServerFn } from "@tanstack/react-start";
import { getComposition } from "./api";
import { isPreview } from "./preview";

// The single, server-only entry point for fetching a composition. Route loaders
// call this; TanStack Start runs it on the server for the initial request and
// via RPC during client-side navigation, so the Uniform API key never reaches
// the browser. When a sealed preview cookie is present we fetch draft content.
export const fetchComposition = createServerFn({ method: "GET" })
  .validator((path: string) => path)
  // Return type is `any`: a Uniform composition is plain JSON and serializes
  // fine, but its `value?: unknown` fields trip TanStack's compile-time
  // serialization guard. Loaders re-type the result as RootComponentInstance.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data: path }): Promise<any> => {
    const preview = await isPreview();
    return getComposition(path, { preview });
  });
