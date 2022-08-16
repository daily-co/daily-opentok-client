import { OTError } from "@opentok/client";
import Daily from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";
import { getParticipantTracks, mediaId, notImplemented } from "./utils";

export function checkSystemRequirements() {
  return Daily.supportedBrowser();
}

export function upgradeSystemRequirements() {
  // Left empty
  console.debug("upgradeSystemRequirements called");
}

export function getDevices(
  callback: (error: OTError | undefined, devices?: OT.Device[]) => void
): void {
  navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      const OTDevices: OT.Device[] = devices
        .filter((device) => {
          return device.kind === "videoinput" || device.kind === "audioinput";
        })
        .map((device) => {
          return {
            deviceId: device.deviceId,
            kind: device.kind === "videoinput" ? "videoInput" : "audioInput",
            label: device.label,
          };
        });

      callback(undefined, OTDevices);
    })
    .catch((err: Error) => {
      callback(err);
    });
}

// FROM DOCS:
// Note that calling OT.initSession() does not initiate
// communications with the cloud. It simply initializes
// the Session object that you can use to connect (and
// to perform other operations once connected).
export function initSession(
  // Doesn't look like Daily needs this at all, but it's required by the opentok API
  partnerId: string,
  // sessionId in tokbox, renamed this to roomUrl to match the Daily API
  roomUrl: string,
  options?: {
    connectionEventsSuppressed?: boolean;
    iceConfig?: {
      includeServers: "all" | "custom";
      transportPolicy: "all" | "relay";
      customServers: {
        urls: string | string[];
        username?: string;
        credential?: string;
      }[];
    };
    ipWhitelist?: boolean;
    encryptionSecret?: string;
  }
): Session {
  const session = new Session(partnerId, roomUrl, options);

  return session;
}

export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OTError | undefined) => void) | undefined
): Publisher {
  const publisher = new Publisher({
    width: properties?.width ?? "",
    height: properties?.height ?? "",
    insertMode: properties?.insertMode,
  });

  // TODO(jamsea): initPublisher function signature needs
  // all of it's edge cases checked (e.g. no targetElement, no properties, etc)
  if (!targetElement) {
    callback?.(new Error("No target element provided"));
    return publisher;
  }

  const dailyElementId =
    targetElement instanceof HTMLElement ? targetElement.id : targetElement;

  window.call =
    window.call ??
    Daily.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
    });

  window.call.startCamera().catch((err) => {
    console.error("startCamera error: ", err);
  });

  window.call.on("participant-updated", (dailyEvent) => {
    if (!dailyEvent) {
      return;
    }

    const { participant } = dailyEvent;
    const { session_id, local } = participant;
    const { video } = getParticipantTracks(participant);

    if (!local || !video) {
      return;
    }

    let root = document.getElementById(dailyElementId);

    if (root === null) {
      root = document.createElement("div");
      document.body.appendChild(root);
    }

    const documentVideoElm = document.getElementById(
      mediaId(video, session_id)
    );

    if (
      !(documentVideoElm instanceof HTMLVideoElement) &&
      documentVideoElm != undefined
    ) {
      return callback?.(new Error("Video element id is invalid."));
    }

    const videoEl = documentVideoElm
      ? documentVideoElm
      : document.createElement("video");

    // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
    switch (publisher.insertMode) {
      case "append":
        root.appendChild(videoEl);
        break;
      case "replace":
        notImplemented();
        break;
      case "before":
        notImplemented();
        break;
      case "after":
        notImplemented();
        break;
      default:
        break;
    }

    videoEl.style.width = publisher.width ?? "";
    videoEl.style.height = publisher.height ?? "";
    videoEl.srcObject = new MediaStream([video]);
    videoEl.id = mediaId(video, session_id);
    videoEl.play().catch((e) => {
      console.error("ERROR LOCAL CAMERA PLAY");
      console.error(e);
    });
  });

  window.call.setLocalVideo(true);
  window.call.setLocalAudio(true);

  return publisher;
}
