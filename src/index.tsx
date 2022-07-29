import React from "react";
import { createRoot } from "react-dom/client";

// import { App } from "./App";
// const {
//   VITE_TOKBOX_API_KEY: apiKey = "",
//   VITE_TOKBOX_SESSION_ID: sessionId = "",
//   VITE_TOKBOX_TOKEN: token = "",
// } = import.meta.env;

import { App } from "./DailyApp";
const { VITE_DAILY_TOKEN: apiKey = "" } = import.meta.env;
const sessionId = "https://hush.daily.co/meet/";
const token = "";

const root = createRoot(document.getElementById("root"));
root.render(<App apiKey={apiKey} sessionId={sessionId} token={token} />);
