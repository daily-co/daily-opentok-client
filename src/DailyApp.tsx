// @ts-nocheck
import React, { useEffect } from "react";
import Daily from "@daily-co/daily-js";

interface AppProps {
  apiKey?: string;
  sessionId?: string;
  token?: string;
}

export function App({ apiKey, sessionId, token }: AppProps) {
  console.log("Daily version: %s", Daily.version());

  // Account & room settings
  const ROOM_URL = "https://hush.daily.co/meet/";
  // Create call object instance
  const callObject = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    //videoSource: false,
    //audioSource: false,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  useEffect(() => {
    // Connect to the room
    callObject
      .join({
        url: ROOM_URL,
      })
      .catch((err) => {
        console.error(err);
      });
  });

  // events
  callObject.on("track-started", startTrack);
  callObject.on("camera-error", cameraError);

  function cameraError(evt) {
    console.error("Your device error was: ", evt);
  }

  function startTrack(evt) {
    console.log("Track started: ", evt);
    if (evt.track.kind === "audio" && evt.participant.local === false) {
      let audiosDiv = document.getElementById("audios") as HTMLElement;
      let audioEl = document.createElement("audio");
      audiosDiv.appendChild(audioEl);
      audioEl.style.width = "100%";
      audioEl.srcObject = new MediaStream([evt.track]);
      audioEl.play();
    } else if (evt.track.kind === "video") {
      let videosDiv = document.getElementById("videos") as HTMLElement;
      let videoEl = document.createElement("video");
      videosDiv.appendChild(videoEl);
      videoEl.style.width = "100%";
      videoEl.srcObject = new MediaStream([evt.track]);
      videoEl.play();
    }
  }

  return (
    <>
      <div id="videos"></div>
      <div id="audios"></div>
    </>
  );
}
