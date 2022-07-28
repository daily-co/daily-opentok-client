import React from "react";
import "./App.css";
// import * as OT from "@opentok/client";
import * as OT from "./shim";

interface AppProps {
  apiKey: string;
  sessionId: string;
  token: string;
}
export const App = ({ apiKey, sessionId, token }: AppProps) => {
  console.log("-- apiKey: ", apiKey);
  console.log("-- sessionId: ", sessionId);
  console.log("-- token: ", token);

  function handleError(error) {
    if (error) {
      console.error(error);
    }
  }

  var session = OT.initSession(apiKey, sessionId);

  // Subscribe to a newly created stream
  session.on("streamCreated", function streamCreated(event) {
    session.subscribe(
      //@ts-ignore
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
    //@ts-ignore
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
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      session.publish(publisher, handleError);
    }
  });

  return <div></div>;
};
