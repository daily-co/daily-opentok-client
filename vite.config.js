import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mkcert()],
  build: {
    lib: {
      entry: dirname(fileURLToPath(import.meta.url)) + "/src/shim.ts",
      name: "OT",
      // the proper extensions will be added
      fileName: "daily-tokbox",
    },
    rollupOptions: {
      external: ["react"],
    },
  },
  server: { https: true },
});
