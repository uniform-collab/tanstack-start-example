import { createFileRoute } from "@tanstack/react-router";
import { fetchComposition, type CompositionResult } from "../uniform/composition";
import { CompositionView } from "../CompositionView";

export const Route = createFileRoute("/")({
  loader: (): Promise<CompositionResult> => fetchComposition({ data: "/" }),
  component: HomeRoute,
});

function HomeRoute() {
  const { composition, draft } = Route.useLoaderData();
  return <CompositionView data={composition} draft={draft} />;
}
