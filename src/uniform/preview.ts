import { useSession } from "@tanstack/react-start/server";

// Sealed (encrypted + signed) cookie that flags a request as being in Uniform
// preview mode. The contents are opaque to the browser and cannot be forged
// without the server-side password, so a visitor can't flip themselves into
// draft mode by hand-crafting a cookie.
export const PREVIEW_COOKIE_NAME = "uniform-preview";

type PreviewSession = {
  preview?: boolean;
};

// The same secret authorizes the inbound /api/preview request (matched against
// the `secret` query param Uniform sends) and seals the cookie. h3 requires the
// sealing password to be at least 32 characters.
function sessionPassword(): string {
  const secret = process.env.UNIFORM_PREVIEW_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "UNIFORM_PREVIEW_SECRET must be set to a string of at least 32 characters to use preview mode."
    );
  }
  return secret;
}

// Kept internal: the session manager's type isn't part of Start's public API,
// so exporting it directly would force a non-portable deep type import.
function getPreviewSession() {
  const isProd = process.env.NODE_ENV === "production";
  return useSession<PreviewSession>({
    name: PREVIEW_COOKIE_NAME,
    password: sessionPassword(),
    // One hour is plenty for an editing session; the editor re-hits the
    // preview endpoint on each navigation so the window keeps sliding.
    maxAge: 60 * 60,
    cookie: {
      path: "/",
      httpOnly: true,
      // The Canvas editor renders the site inside a cross-origin iframe, so the
      // cookie must be SameSite=None (which in turn requires Secure) in prod.
      // Locally we fall back to Lax over http so the cookie isn't dropped.
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    },
  });
}

// Server-only check used by the composition loader to decide between published
// and draft content. Any failure (missing secret, no/garbled cookie) is treated
// as "not previewing" so normal traffic always gets published content.
export async function isPreview(): Promise<boolean> {
  try {
    const session = await getPreviewSession();
    return session.data.preview === true;
  } catch {
    return false;
  }
}

// Seal the preview flag into the cookie (called from /api/preview once the
// shared secret has been validated).
export async function enablePreview(): Promise<void> {
  const session = await getPreviewSession();
  await session.update({ preview: true });
}

// Clear the preview cookie to leave preview mode.
export async function exitPreview(): Promise<void> {
  const session = await getPreviewSession();
  await session.clear();
}
