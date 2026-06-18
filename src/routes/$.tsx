import { createFileRoute } from "@tanstack/react-router";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { fetchComposition } from "../uniform/composition";
import { CompositionView } from "../CompositionView";

// Splat route: matches any non-root path and fetches the composition for that
// project map node path (e.g. "/about", or "/api/preview" in preview mode).
export const Route = createFileRoute("/$")({
  loader: ({ params }): Promise<RootComponentInstance> =>
    fetchComposition({ data: `/${params._splat ?? ""}` }),
  component: CompositionRoute,
});

function CompositionRoute() {
  const composition = Route.useLoaderData();
  return <CompositionView composition={composition} />;
}
