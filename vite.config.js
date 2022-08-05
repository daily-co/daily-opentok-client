import { resolve } from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  console.log("env: ", env.VITE_TOKBOX_TOKEN);

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: "build",
      lib: {
        entry: resolve(__dirname, "src/shim.ts"),
        name: "OT",
        // the proper extensions will be added
        fileName: "daily-tokbox",
      },
      // rollupOptions: {
      //   // make sure to externalize deps that shouldn't be bundled
      //   // into your library
      //   external: ["vue"],
      //   output: {
      //     // Provide global variables to use in the UMD build
      //     // for externalized deps
      //     globals: {
      //       vue: "Vue",
      //     },
      //   },
      // },
    },
    server: {
      strictPort: true,
      hmr: {
        port: 443, // Run the websocket server on the SSL port
      },
    },
  });
};
