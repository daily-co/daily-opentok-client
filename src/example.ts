/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import "./example.css";

// import * as OT from "@opentok/client";
// const {
//   VITE_TOKBOX_API_KEY: apiKey = "",
//   VITE_TOKBOX_SESSION_ID: sessionId = "",
//   VITE_TOKBOX_TOKEN: token = "",
// } = import.meta.env;
// OT.setLogLevel(4);

import * as OT from "./";

const { VITE_DAILY_MEETING_TOKEN } = import.meta.env;
// apiKey can be blank, Daily's API key is not needed for the shim to work
const apiKey = "";
const sessionId = "https://hush.daily.co/demo";
const token =
  typeof VITE_DAILY_MEETING_TOKEN === "string" ? VITE_DAILY_MEETING_TOKEN : "";

const audioSelector = document.querySelector(
  "#audio-source-select"
) as HTMLSelectElement;
const videoSelector = document.querySelector(
  "#video-source-select"
) as HTMLSelectElement;
const publishBtn = document.querySelector("#publish-btn") as HTMLButtonElement;
const cycleVideoBtn = document.querySelector(
  "#cycle-video-btn"
) as HTMLButtonElement;

let publisher: OT.Publisher | null = null;

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
  console.log("[streamCreated] index.ts: ", event.stream);
  // This is daily remote user stuff
  // if (!window.chrome) {
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
  // }
});

session.on("sessionDisconnected", function sessionDisconnected(event) {
  console.debug("[sessionDisconnected]", event);
});

// Get the list of devices and populate the drop down lists
function populateDeviceSources(
  selector: Element,
  kind: "audioInput" | "videoInput"
) {
  OT.getDevices((err, devices = []) => {
    if (err) {
      console.error("getDevices error ", err);
      return;
    }

    let index = 0;
    selector.innerHTML = devices.reduce((innerHTML, device) => {
      if (device.kind === kind) {
        index += 1;
        return `${innerHTML}<option value="${device.deviceId}">${
          device.label || `${device.kind}${index}`
        }</option>`;
      }
      return innerHTML;
    }, "");
    publishBtn.disabled = false;
  });
}
publishBtn.disabled = false;
// We request access to Microphones and Cameras so we can get the labels
OT.getUserMedia()
  .then((stream) => {
    populateDeviceSources(audioSelector, "audioInput");
    populateDeviceSources(videoSelector, "videoInput");
    // Stop the tracks so that we stop using this camera and microphone
    // If you don't do this then cycleVideo does not work on some Android devices
    stream.getTracks().forEach((track) => track.stop());
  })
  .catch((err) => {
    console.error(err);
  });

// Start publishing when you click the publish button
publishBtn.addEventListener("click", () => {
  // Disable the audio and video pickers and hide the publish button
  audioSelector.disabled = true;
  videoSelector.disabled = true;
  publishBtn.style.display = "none";

  // Start publishing with the selected devices
  publisher = OT.initPublisher(
    "publisher",
    {
      insertMode: "append",
      width: "100%",
      height: "100%",
      audioSource: audioSelector.value,
      videoSource: videoSelector.value,
    },
    (err) => {
      if (err) {
        console.error("Publish error ", err);
      } else {
        setupDeviceSwitching();
        setupAudioLevelMeter();
      }
    }
  );
});

// publishBtn.addEventListener("click", initializeSession);

// Allow you to switch to different cameras and microphones using
// setAudioSource and cycleVideo
function setupDeviceSwitching() {
  audioSelector.disabled = false;

  // When the audio selector changes we update the audio source
  audioSelector.addEventListener("change", () => {
    if (!publisher) {
      console.log("No publisher");
      return;
    }
    audioSelector.disabled = true;
    publisher
      .setAudioSource(event.target.value)
      .then(() => {
        audioSelector.disabled = false;
      })
      .catch((err) => {
        console.error("setAudioSource error", err);
        audioSelector.disabled = false;
      });
  });

  // When the cycleVideo button is clicked we call cycleVideo
  cycleVideoBtn.addEventListener("click", () => {
    if (!publisher) {
      console.log("No publisher");
      return;
    }
    cycleVideoBtn.disabled = true;
    publisher
      .cycleVideo()
      .then(({ deviceId }) => {
        videoSelector.value = deviceId;
        cycleVideoBtn.disabled = false;
      })
      .catch((err) => {
        console.error("cycleVideo error", err);
        cycleVideoBtn.disabled = false;
      });
  });
  cycleVideoBtn.style.display = "inline-block";
}

function setupAudioLevelMeter() {
  if (!publisher) {
    console.log("No publisher");
    return;
  }
  const audioLevel = document.querySelector("#audio-meter") as HTMLDivElement;
  const meter = document.querySelector(
    "#audio-meter meter"
  ) as HTMLMeterElement;
  audioLevel.style.display = "block";
  let movingAvg: number | null = null;
  publisher.on("audioLevelUpdated", (event) => {
    if (movingAvg === null || movingAvg <= event.audioLevel) {
      movingAvg = event.audioLevel;
    } else {
      movingAvg = 0.7 * movingAvg + 0.3 * event.audioLevel;
    }

    // 1.5 scaling to map the -30 - 0 dBm range to [0,1]
    let logLevel = Math.log(movingAvg) / Math.LN10 / 1.5 + 1;
    logLevel = Math.min(Math.max(logLevel, 0), 1);
    meter.value = logLevel;
  });
}

function connect() {
  console.log("click connect");
  // Connect to the session (or Daily room in our case)
  session.connect(token, function callback(error) {
    console.debug("[session.connect]");

    if (!publisher) {
      console.error("No publisher");
      return;
    }

    if (error) {
      handleError(error);
    } else {
      console.log("session.connect publisher: ", publisher);
      // If the connection is successful, publish the publisher (remote) to the session
      //if (!window.chrome) {

      session.publish(publisher, handleError);
      //}
    }
  });
}
document.getElementById("connect-btn")?.addEventListener("click", connect);
