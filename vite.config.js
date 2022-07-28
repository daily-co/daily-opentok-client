import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";


// https://vitejs.dev/config/
export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')


  console.log("env: ", env.VITE_TOKBOX_TOKEN);  

  return defineConfig({
    plugins: [react()],
    build: {
      outDir: "build",
    },
    server: {
      strictPort: true,
      hmr: {
        port: 443, // Run the websocket server on the SSL port
      },
    },
  });
};
