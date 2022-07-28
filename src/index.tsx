import React from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const { VITE_TOKBOX_API_KEY, VITE_TOKBOX_SESSION_ID, VITE_TOKBOX_TOKEN } =
  import.meta.env;

const root = createRoot(document.getElementById("root"));
root.render(
  <App
    apiKey={VITE_TOKBOX_API_KEY}
    sessionId={VITE_TOKBOX_SESSION_ID}
    token={VITE_TOKBOX_TOKEN}
  />
);
