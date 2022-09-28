import "./example.css";

// import { Event as OTEvent, Session } from "@opentok/client";

// import * as OT from "@opentok/client";
// const {
//   VITE_TOKBOX_API_KEY: apiKey = "",
//   VITE_TOKBOX_SESSION_ID: sessionId = "",
//   VITE_TOKBOX_TOKEN: token = "",
// } = import.meta.env;
// OT.setLogLevel(5);

import * as OT from "./";

const { VITE_DAILY_MEETING_TOKEN } = import.meta.env;
// apiKey can be blank, Daily's API key is not needed for the shim to work
const apiKey = "";
const sessionId = "https://hush.daily.co/meet";
const token =
  typeof VITE_DAILY_MEETING_TOKEN === "string" ? VITE_DAILY_MEETING_TOKEN : "";

function handleError(error: unknown) {
  if (error) {
    console.error("handleError: ", error);
  }
}

// sessionId becomes daily's room url
const session = OT.initSession(apiKey, sessionId);

// Subscribe to a newly created stream.
// This does not cause a connection to be established.
session.on("streamCreated", function streamCreated(event) {
  console.log("[streamCreated] index.ts: ", event);
  // This is daily remote user stuff
  // if (!window.chrome) {
  session.subscribe(
    event.stream,
    "subscriber",
    {
      insertMode: "append",
    },
    handleError
  );
  // }
});

session.on("sessionDisconnected", function sessionDisconnected(event) {
  console.debug("[sessionDisconnected]", event);
});

// Makes the local user's video appear in the DOM
const publisher = OT.initPublisher(
  "publisher",
  {
    insertMode: "append",
    width: "100%",
    height: "100%",
    name: "James's stream",
  },
  handleError
);

// Connect to the session (or Daily room in our case)
session.connect(token, function callback(error) {
  console.debug("[session.connect]");

  if (error) {
    handleError(error);
  } else {
    // If the connection is successful, publish the publisher (remote) to the session
    //if (!window.chrome) {

    session.publish(publisher, handleError);
    //}
  }
});
