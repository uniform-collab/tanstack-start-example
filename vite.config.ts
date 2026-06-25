import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";

// https://tanstack.com/start/latest
export default defineConfig({
  // Bind the dual-stack IPv6 wildcard so the dev/preview server is reachable over
  // IPv6 (sandbox proxies like Daytona dial [::1]) AND IPv4 — "0.0.0.0" would be
  // IPv4-only and still fail [::1]. Honor PORT so the sandbox can pin the port its
  // proxy expects (default 3000).
  server: {
    host: "::",
    port: Number(process.env.PORT) || 3000,
  },
  preview: {
    host: "::",
    port: Number(process.env.PORT) || 3000,
  },
  plugins: [
    tanstackStart(),
    // The React plugin must come after TanStack Start's plugin.
    react(),
  ],
});
