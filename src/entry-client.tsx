import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element #root not found");
}

ReactDOM.hydrateRoot(
  rootElement,
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
