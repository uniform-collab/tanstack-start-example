import { createFileRoute } from "@tanstack/react-router";
import { fetchComposition, type CompositionResult } from "../uniform/composition";
import { CompositionView } from "../CompositionView";

// Splat route: matches any non-root path and fetches the composition for that
// project map node path (e.g. "/about", or "/api/preview" in preview mode).
export const Route = createFileRoute("/$")({
  loader: ({ params }): Promise<CompositionResult> =>
    fetchComposition({ data: `/${params._splat ?? ""}` }),
  component: CompositionRoute,
});

function CompositionRoute() {
  const { composition, draft } = Route.useLoaderData();
  return <CompositionView data={composition} draft={draft} />;
}
