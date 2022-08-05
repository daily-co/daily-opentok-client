import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode, ssrBuild }) => {
  const isBuild = command === "build";

  console.log("isBuild", isBuild);

  const entry = isBuild
    ? dirname(fileURLToPath(import.meta.url)) + "/src/shim.ts"
    : dirname(fileURLToPath(import.meta.url)) + "/src/index.ts";

  const fileName = isBuild ? "daily-tokbox" : "index";

  const lib = {
    entry,
    name: "OT",
    // the proper extensions will be added
    fileName,
  };

  return {
    plugins: [react(), mkcert()],
    build: {
      lib,
      rollupOptions: {
        output: { format: "iife", name: "OT" },
      },
    },
    server: { https: true },
  };
});
