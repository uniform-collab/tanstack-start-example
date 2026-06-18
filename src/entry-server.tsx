import React from "react";
import ReactDOMServer from "react-dom/server";
import type { RootComponentInstance } from "@uniformdev/canvas";
import App from "./App";

export type RenderResult = {
  html: string;
  dataScript: string;
};

export async function render({
  composition,
}: {
  composition?: RootComponentInstance;
}): Promise<RenderResult> {
  const html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <App composition={composition} />
    </React.StrictMode>
  );
  const dataScript = `<script>window._uniformPreloadedComposition = ${JSON.stringify(composition)};</script>`;
  return { html, dataScript };
}
