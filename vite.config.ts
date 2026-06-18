import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-swc";

// https://tanstack.com/start/latest
export default defineConfig({
  server: {
    port: 5173,
  },
  plugins: [
    tanstackStart(),
    // The React plugin must come after TanStack Start's plugin.
    react(),
  ],
});
