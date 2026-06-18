import { UniformComposition } from "@uniformdev/canvas-react";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { resolveRenderer } from "./components";

export function CompositionView({
  composition,
}: {
  composition?: RootComponentInstance;
}) {
  return (
    <UniformComposition
      data={composition}
      behaviorTracking="onLoad"
      resolveRenderer={resolveRenderer}
    />
  );
}
