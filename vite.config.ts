import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, LibraryOptions } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isBuild = command === "build";
  const isDev = mode === "development";

  const entry = isBuild
    ? dirname(fileURLToPath(import.meta.url)) + "/src/index.ts"
    : dirname(fileURLToPath(import.meta.url)) + "/src/example.ts";

  const fileName = isBuild ? "opentok" : "index";

  const lib: LibraryOptions = {
    formats: ["es", "umd"],
    entry,
    name: "OT",
    // the proper extensions will be added
    fileName,
  };

  return {
    plugins: [mkcert()],
    build: {
      minify: !isDev,
      sourcemap: true,
      lib,
      output: {
        footer: `
for (const key of Object.keys(globalThis.OT)) {
  globalThis[key] = globalThis.OT[key]
}
`,
      },
    },
    server: { https: true },
  };
});
