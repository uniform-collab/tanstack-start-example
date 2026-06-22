import { createServerFn } from "@tanstack/react-start";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { getComposition, isDraftMode } from "./api";
import { isPreview } from "./preview";

export type CompositionResult = {
  composition: RootComponentInstance;
  // True when draft content is being rendered (dev, or production preview).
  // Routes pass this to CompositionView to toggle contextual editing.
  draft: boolean;
};

// The single, server-only entry point for fetching a composition. Route loaders
// call this; TanStack Start runs it on the server for the initial request and
// via RPC during client-side navigation, so the Uniform API key never reaches
// the browser. When a sealed preview cookie is present we fetch draft content.
export const fetchComposition = createServerFn({ method: "GET" })
  .validator((path: string) => path)
  // Return type is `any`: a Uniform composition is plain JSON and serializes
  // fine, but its `value?: unknown` fields trip TanStack's compile-time
  // serialization guard. Loaders re-type the result as CompositionResult.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .handler(async ({ data: path }): Promise<any> => {
    const preview = await isPreview();
    const composition = await getComposition(path, { preview });
    return { composition, draft: isDraftMode(preview) } satisfies CompositionResult;
  });
