import "dotenv/config";
import {
  CanvasClient,
  CANVAS_DRAFT_STATE,
  CANVAS_PUBLISHED_STATE,
  type RootComponentInstance,
} from "@uniformdev/canvas";

// Lazily created so importing this module never throws (and never connects)
// until a composition is actually fetched on the server.
let client: CanvasClient | null = null;

function canvasClient(): CanvasClient {
  if (client) return client;

  const apiKey = process.env.UNIFORM_API_KEY;
  const projectId = process.env.UNIFORM_PROJECT_ID;
  const apiHost = process.env.UNIFORM_CLI_BASE_URL;
  const edgeApiHost = process.env.UNIFORM_CLI_BASE_EDGE_URL!;

  if (!apiKey || !projectId) {
    throw new Error(
      "Missing Uniform credentials. Set UNIFORM_API_KEY and UNIFORM_PROJECT_ID in your .env file."
    );
  }

  client = new CanvasClient({
    apiKey,
    projectId,
    ...(apiHost ? { apiHost } : {}),
    ...(edgeApiHost ? { edgeApiHost } : {}),
  });

  return client;
}

/**
 * The single shared function for fetching a composition by its project map
 * node path. Server-only -- it reads the Uniform API key from the environment.
 *
 * Draft content is served in development, and in production only when the
 * request is in preview mode (a valid sealed preview cookie is present).
 */
export async function getComposition(
  path: string,
  { preview = false }: { preview?: boolean } = {}
): Promise<RootComponentInstance> {
  const useDraft = preview || process.env.NODE_ENV !== "production";
  const state = useDraft ? CANVAS_DRAFT_STATE : CANVAS_PUBLISHED_STATE;

  const { composition } = await canvasClient().getCompositionByNodePath({
    projectMapNodePath: path || "/",
    state,
  });

  return composition;
}
