import { createFileRoute } from "@tanstack/react-router";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { fetchCompositionById } from "../uniform/composition";
import { CompositionView } from "../CompositionView";

// Editor-only route reached via
//   /api/preview?is_incontext_editing_playground=true&id=<compositionId>
// We resolve the composition/pattern by id server-side; the contextual-editing
// hook inside UniformComposition then live-updates it from the editor's
// postMessage stream.
export const Route = createFileRoute("/playground")({
  validateSearch: (search: Record<string, unknown>): { id: string } => ({
    id: typeof search.id === "string" ? search.id : "",
  }),
  loaderDeps: ({ search: { id } }) => ({ id }),
  loader: ({ deps: { id } }): Promise<RootComponentInstance> =>
    fetchCompositionById({ data: id }),
  component: PlaygroundRoute,
});

function PlaygroundRoute() {
  const composition = Route.useLoaderData();
  return <CompositionView composition={composition} />;
}
