import "dotenv/config";
import {
  CanvasClient,
  UncachedCanvasClient,
  CANVAS_DRAFT_STATE,
  CANVAS_PUBLISHED_STATE,
  type RootComponentInstance,
} from "@uniformdev/canvas";
import { type ClientOptions } from "@uniformdev/context/api";

// Lazily created so importing this module never throws (and never connects)
// until a composition is actually fetched on the server.
let cachedClient: CanvasClient | null = null;
let uncachedClient: UncachedCanvasClient | null = null;

function clientOptions(useDraft: boolean): ClientOptions {
  const apiKey = process.env.UNIFORM_API_KEY;
  const projectId = process.env.UNIFORM_PROJECT_ID;
  const apiHost = process.env.UNIFORM_CLI_BASE_URL;
  const edgeApiHost = process.env.UNIFORM_CLI_BASE_EDGE_URL;

  if (!apiKey || !projectId) {
    throw new Error(
      "Missing Uniform credentials. Set UNIFORM_API_KEY and UNIFORM_PROJECT_ID in your .env file."
    );
  }

  return {
    apiKey,
    projectId,
    ...(apiHost ? { apiHost } : {}),
    ...(edgeApiHost ? { edgeApiHost } : {}),
    bypassCache: useDraft,
  };
}

// Published content is served through the cached edge client. Draft/preview
// content uses the uncached client (bypasses the edge CDN cache) so editors
// always see their latest changes instead of a stale cached response.
function canvasClient(useDraft: boolean): CanvasClient {
  const options = clientOptions(useDraft);
  if (useDraft) {
    return (uncachedClient ??= new UncachedCanvasClient(options));
  }
  return (cachedClient ??= new CanvasClient(options));
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

  const { composition } = await canvasClient(useDraft).getCompositionByNodePath({
    projectMapNodePath: path || "/",
    state,
    withComponentIDs: true,
  });

  return composition;
}

/**
 * Fetches a composition (or pattern) by its id. Used by the playground route,
 * which is opened by the editor with the composition id in the query string.
 * Server-only.
 */
export async function getCompositionById(
  id: string,
  { preview = false }: { preview?: boolean } = {}
): Promise<RootComponentInstance> {
  const useDraft = preview || process.env.NODE_ENV !== "production";
  const state = useDraft ? CANVAS_DRAFT_STATE : CANVAS_PUBLISHED_STATE;

  const { composition } = await canvasClient(useDraft).getCompositionById({
    compositionId: id,
    state,
    withComponentIDs: true,
  });

  return composition;
}
