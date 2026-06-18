import "dotenv/config";
import {
  CanvasClient,
  CANVAS_DRAFT_STATE,
  CANVAS_PUBLISHED_STATE,
  type RootComponentInstance,
} from "@uniformdev/canvas";

const apiKey = process.env.UNIFORM_API_KEY;
const projectId = process.env.UNIFORM_PROJECT_ID;
const apiHost = process.env.UNIFORM_CLI_BASE_URL;

if (!apiKey || !projectId) {
  throw new Error(
    "Missing Uniform credentials. Set UNIFORM_API_KEY and UNIFORM_PROJECT_ID in your .env file."
  );
}

// Single, shared Canvas client used for all composition fetching.
const canvasClient = new CanvasClient({
  apiKey,
  projectId,
  ...(apiHost ? { apiHost } : {}),
});

// In production we want published content; in development we render drafts.
const state =
  process.env.NODE_ENV === "production" ? CANVAS_PUBLISHED_STATE : CANVAS_DRAFT_STATE;

/**
 * The single shared entry point for fetching a composition by its project map
 * node path. Use this everywhere a composition needs to be fetched so the
 * client configuration and fetching behavior stay consistent.
 */
export async function getComposition(path: string): Promise<RootComponentInstance> {
  const { composition } = await canvasClient.getCompositionByNodePath({
    projectMapNodePath: path || "/",
    state,
  });

  return composition;
}
