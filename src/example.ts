/* eslint-disable @typescript-eslint/non-nullable-type-assertion-style */
import "./example.css";
import NetworkTest from "opentok-network-test-js";

// import * as OT from "@opentok/client";
// const {
//   VITE_TOKBOX_API_KEY: apiKey = "",
//   VITE_TOKBOX_SESSION_ID: sessionId = "",
//   VITE_TOKBOX_TOKEN: token = "",
// } = import.meta.env;
// OT.setLogLevel(4);

import OT from "./";
import { Publisher } from "./publisher/Publisher";

const { VITE_DAILY_MEETING_TOKEN } = import.meta.env;
// apiKey can be blank, Daily's API key is not needed for the shim to work
const apiKey = "";
const sessionId = "https://hush.daily.co/sfu";
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

let publisher: Publisher | null = null;

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

let connections: OT.Connection[] = [];
session.on("connectionCreated", (connectionCreatedEvent) => {
  console.log("session connectionCreatedEvent: ", connectionCreatedEvent);
  connections.push(connectionCreatedEvent.connection);

  if (
    connections.find(
      (connection) =>
        connection.connectionId ===
        connectionCreatedEvent.connection.connectionId
    )
  ) {
    console.log("connection already exists");
    return;
  }
  connections.push(connectionCreatedEvent.connection);
});

session.on("connectionDestroyed", (connectionDestroyedEvent) => {
  console.log("session connectionDestroyedEvent: ", connectionDestroyedEvent);
  connections = connections.filter(
    (connection) =>
      connection.connectionId !==
      connectionDestroyedEvent.connection.connectionId
  );
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

    for (const device of devices) {
      if (device.kind !== kind) continue;
      const optionEle = document.createElement("option");
      optionEle.value = device.deviceId;
      optionEle.innerText =
        device.label || `${device.kind}${selector.children.length}`;
      selector.appendChild(optionEle);
    }
  });
}
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
  const videoSource = videoSelector.options[videoSelector.selectedIndex].value;
  const audioSource = audioSelector.options[audioSelector.selectedIndex].value;
  // Start publishing with the selected devices
  publisher = OT.initPublisher(
    "publisher",
    {
      insertMode: "append",
      width: "100%",
      height: "100%",
      audioSource,
      videoSource,
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

function destroy() {
  publisher?.destroy();
}
document.getElementById("destroy-btn")?.addEventListener("click", destroy);

// Allow you to switch to different cameras and microphones using
// setAudioSource and cycleVideo
function setupDeviceSwitching() {
  audioSelector.disabled = false;

  // When the audio selector changes we update the audio source
  audioSelector.addEventListener("change", (evt) => {
    console.log("change", evt);
    if (!publisher) {
      console.log("No publisher");
      return;
    }
    audioSelector.disabled = true;
    console.log(evt.target);
    publisher
      .setAudioSource(audioSelector.value)
      .catch((err: unknown) => {
        console.error("setAudioSource error", err);
      })
      .finally(() => {
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
      .catch((err: unknown) => {
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
      console.debug("No publisher");
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

function disconnect() {
  console.log("click disconnect");
  session.disconnect();
}
document
  .getElementById("disconnect-btn")
  ?.addEventListener("click", disconnect);

function forceDisconnect() {
  console.log("click force disconnect");
  connections.forEach((connection) => {
    session.forceDisconnect(connection, (err) => {
      console.error(err);
    });
  });
}
document
  .getElementById("force-disconnect-btn")
  ?.addEventListener("click", forceDisconnect);

function networkTest() {
  const otNetworkTest = new NetworkTest(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    window.OT,
    {
      apiKey: apiKey.length > 0 ? apiKey : "daily-test",
      sessionId,
      token: token.length > 0 ? token : "daily-test",
    },
    {}
  );
  otNetworkTest
    .testConnectivity()
    .then((results) => {
      console.log("OpenTok connectivity test results", results);
    })
    .catch(function (error) {
      console.log("OpenTok connectivity test error", error);
    })
    .finally(() => {
      console.log("FINALLY");
    });
}
document
  .getElementById("network-test-btn")
  ?.addEventListener("click", networkTest);

function sendSignal() {
  console.log("click send signal");
  connections.forEach((connection) => {
    session.signal(
      {
        type: "test",
        data: "test message to " + connection.connectionId,

        to: connection,
      },
      function (error) {
        if (error) {
          console.log("signal error (" + error.name + "): " + error.message);
        } else {
          console.log("signal sent.");
        }
      }
    );
  });
}
document.getElementById("signal-btn")?.addEventListener("click", sendSignal);

session.on("signal", (event) => {
  console.log("signal", event);
});

session.on("signal:test", (event) => {
  console.log("signal:test", event);
});

session.on("sessionDisconnected", (event) => {
  console.log("sessionDisconnected", event);
});

session.on("streamDestroyed", (event) => {
  console.log("streamDestroyed", event);
});
