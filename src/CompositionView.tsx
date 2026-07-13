import { UniformComposition } from "@uniformdev/canvas-react";
import { useSearch } from "@tanstack/react-router";
import type { RootComponentInstance } from "@uniformdev/canvas";
import { resolveRenderer } from "./components";

export function CompositionView({ composition }: { composition: RootComponentInstance }) {
  // In "code" mode we pin the rendered composition to the server-resolved one
  // (the enhancer ignores editor pushes). In visual mode we omit the prop so the
  // contextual-editing hook's default applies and live edits stream through.
  const { mode } = useSearch({ strict: false }) as { mode?: string };

  return (
    <UniformComposition
      data={composition}
      behaviorTracking="onLoad"
      resolveRenderer={resolveRenderer}
      contextualEditingEnhancer={mode === "code" ? () => composition : undefined}
    />
  );
}
