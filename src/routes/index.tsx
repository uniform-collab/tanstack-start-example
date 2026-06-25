import { createFileRoute } from "@tanstack/react-router";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { fetchComposition } from "../uniform/composition";
import { CompositionView } from "../CompositionView";

export const Route = createFileRoute("/")({
  loader: (): Promise<RootComponentInstance> => fetchComposition({ data: "/" }),
  component: HomeRoute,
});

function HomeRoute() {
  const composition = Route.useLoaderData();
  return <CompositionView composition={composition} />;
}
