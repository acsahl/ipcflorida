import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  server: {
    // Bind IPv4 explicitly. Left to itself Vite listens on [::1] only, which
    // `netlify dev` can't reach over IPv4 — it then silently falls back to the
    // SPA redirect in netlify.toml and serves index.html for /src/*.jsx, so
    // the page loads with an empty <div id="root">.
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
});
