import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isBuild = command === "build";

  const entry = isBuild
    ? dirname(fileURLToPath(import.meta.url)) + "/src/index.ts"
    : dirname(fileURLToPath(import.meta.url)) + "/src/example.ts";

  const fileName = isBuild ? "daily-tokbox" : "index";

  const lib = {
    entry,
    name: "OT",
    // the proper extensions will be added
    fileName,
  };

  return {
    plugins: [mkcert()],
    build: {
      minify: false,
      sourcemap: "inline",
      lib,
      rollupOptions: {
        output: { format: "iife", name: "OT", exports: "named" },
      },
    },
    server: { https: true },
  };
});
