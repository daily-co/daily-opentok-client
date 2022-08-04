// import { Event as OTEvent, Session } from "@opentok/client";
// type StreamCreatedEvent = OTEvent<"streamCreated", Session>;

import "./App.css";
// import * as OT from "@opentok/client";
// const {
//   VITE_TOKBOX_API_KEY: apiKey = "",
//   VITE_TOKBOX_SESSION_ID: sessionId = "",
//   VITE_TOKBOX_TOKEN: token = "",
// } = import.meta.env;

import * as OT from "./shim";

const { VITE_DAILY_TOKEN: apiKey = "" } = import.meta.env;
const sessionId = "https://hush.daily.co/meet/";
const token = "";

console.log("-- apiKey: ", apiKey);
console.log("-- sessionId: ", sessionId);
console.log("-- token: ", token);

function handleError(error: any) {
  if (error) {
    console.error("handleError: ", error);
  }
}

// sessionId becomes daily's room url
var session = OT.initSession(apiKey, sessionId);

// Subscribe to a newly created stream
session.on("streamCreated", function streamCreated(event: any) {
  console.debug("[streamCreated] index.ts: ", event);
  // This is daily remote user stuff
  session.subscribe(
    event.stream,
    "subscriber",
    {
      insertMode: "append",
      width: "100%",
      height: "100%",
    },
    handleError
  );
});

session.on("sessionDisconnected", function sessionDisconnected(event) {
  console.log("You were disconnected from the session.", event.reason);
});

const publisher = OT.initPublisher(
  "publisher",
  {
    insertMode: "append",
    width: "100%",
    height: "100%",
  },
  handleError
);

// Connect to the session
session.connect(token, function callback(error) {
  // This is daily local user stuff
  if (error) {
    handleError(error);
  } else {
    // If the connection is successful, publish the publisher to the session
    session.publish(publisher, handleError);
  }
});
