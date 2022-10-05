import {
  AudioOutputDevice,
  GetUserMediaProperties,
  OTError,
  ScreenSharingCapabilityResponse,
  Stream,
} from "@opentok/client";
import Daily from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";
import { getParticipantTracks, getVideoTagID, notImplemented } from "./utils";

export function checkScreenSharingCapability(
  callback: (response: ScreenSharingCapabilityResponse) => void
): void {
  return Daily.supportedBrowser().supportsScreenShare
    ? callback({
        supported: true,
        extensionRegistered: false,
        supportedSources: {
          screen: true,
          window: true,
        },
      })
    : callback({
        supported: false,
        extensionRegistered: false,
        supportedSources: {
          screen: false,
          window: false,
        },
      });
}

export function checkSystemRequirements(): number {
  return Daily.supportedBrowser().supported ? 1 : 0;
}

export function getActiveAudioOutputDevice(): Promise<AudioOutputDevice> {
  notImplemented();
}

export function upgradeSystemRequirements() {
  // Left empty
  console.debug("upgradeSystemRequirements called");
}

export function getDevices(
  callback: (error: OTError | undefined, devices?: OT.Device[]) => void
): void {
  window.call =
    window.call ??
    Daily.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
    });

  window.call
    .enumerateDevices()
    .then(({ devices }) => {
      const OTDevices: OT.Device[] = devices
        .filter((device) => /^(audio|video)input$/.test(device.kind))
        .map((device) => {
          device.kind;
          return {
            deviceId: device.deviceId,
            kind: device.kind.includes("audio") ? "audioInput" : "videoInput",
            label: device.label,
          };
        });

      callback(undefined, OTDevices);
    })
    .catch((err: Error) => {
      callback(err);
    });
}

export function getSupportedCodecs(): Promise<{
  videoEncoders: ("H264" | "VP8")[];
  videoDecoders: ("H264" | "VP8")[];
}> {
  return Daily.supportedBrowser().supported
    ? Promise.resolve({
        videoDecoders: ["H264", "VP8"],
        videoEncoders: ["H264", "VP8"],
      })
    : Promise.resolve({ videoDecoders: [], videoEncoders: [] });
}

export function getUserMedia(
  properties?: GetUserMediaProperties
): Promise<MediaStream> {
  if (!properties) {
    return navigator.mediaDevices.getUserMedia();
  }
  const {
    audioSource,
    videoSource,
    autoGainControl,
    echoCancellation,
    facingMode,
    frameRate,
    noiseSuppression,
    resolution = "",
  } = properties;

  let video: boolean | MediaTrackConstraints | undefined = undefined;

  if (typeof videoSource === "boolean") {
    video = videoSource;
  } else if (videoSource instanceof window.MediaStreamTrack) {
    const [width, height] = resolution.split("x");

    video = {
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      frameRate: frameRate
        ? {
            ideal: frameRate,
          }
        : undefined,
      facingMode,
    };
  } else if (typeof videoSource === "string") {
    video = { deviceId: videoSource };
  }

  let audio: boolean | MediaTrackConstraints | undefined = undefined;

  if (typeof audioSource === "boolean") {
    audio = audioSource;
  } else if (audioSource instanceof MediaStreamTrack) {
    audio = {
      noiseSuppression,
      echoCancellation,
      autoGainControl,
    };
  } else if (typeof audioSource === "string") {
    audio = { deviceId: audioSource };
  }

  return navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });
}

export function hasMediaProcessorSupport(): boolean {
  return Daily.supportedBrowser().supportsVideoProcessing;
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

  const completionHandler =
    typeof callback === "function"
      ? callback
      : () => {
          // empty
        };

  if (!targetElement) {
    completionHandler(new Error("No target element provided"));
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

  switch (window.call.meetingState()) {
    case "new":
      window.call.startCamera().catch((err) => {
        completionHandler(new Error("Failed to start camera"));
        console.error("startCamera error: ", err);
      });
      break;
    case "loading":
      console.debug("loading");
      break;
    case "loaded":
      console.debug("loaded");
      break;
    case "joining-meeting":
      console.debug("joining-meeting");
      break;
    case "joined-meeting":
      console.debug("joined-meeting");
      break;
    case "left-meeting":
      console.debug("left-meeting");
      break;
    case "error":
      console.debug("error");
      break;
    default:
      break;
  }

  window.call.on("participant-updated", (dailyEvent) => {
    if (!dailyEvent) {
      return;
    }

    const { participant } = dailyEvent;
    const {
      session_id,
      audio: hasAudio,
      video: hasVideo,
      tracks,
      joined_at = new Date(),
      user_id,
      local,
    } = participant;
    const creationTime = joined_at.getTime();

    const settings = tracks.video.track?.getSettings() ?? {};
    const { frameRate = 0, height = 0, width = 0 } = settings;
    const { video } = getParticipantTracks(participant);

    if (!local || !video) {
      return;
    }

    const stream: Stream = {
      streamId: session_id,
      frameRate,
      hasAudio,
      hasVideo,
      // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
      name: "",
      videoDimensions: {
        height,
        width,
      },
      videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
      creationTime,
      connection: {
        connectionId: user_id, // TODO
        creationTime,
        // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
        // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
        data: "",
      },
    };
    publisher.stream = stream;

    let root = document.getElementById(dailyElementId);

    if (root === null) {
      root = document.createElement("div");
      document.body.appendChild(root);
    }

    const documentVideoElm = document.getElementById(getVideoTagID(session_id));

    if (
      !(documentVideoElm instanceof HTMLVideoElement) &&
      documentVideoElm != undefined
    ) {
      return callback?.(new Error("Video element id is invalid."));
    }

    const videoEl = documentVideoElm
      ? documentVideoElm
      : document.createElement("video");

    if (videoEl.srcObject && "getTracks" in videoEl.srcObject) {
      const tracks = videoEl.srcObject.getTracks();
      if (tracks[0].id === video.id) {
        return;
      }
    }

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

    videoEl.id = getVideoTagID(session_id);
    videoEl.play().catch((e) => {
      console.error("ERROR LOCAL CAMERA PLAY");
      console.error(e);
    });
  });

  window.call.setLocalVideo(true);
  window.call.setLocalAudio(true);

  return publisher;
}

let OTlogLevel = 0;
export function setLogLevel(logLevel: number): void {
  OTlogLevel = logLevel;
}

export function log(message: string): void {
  if (OTlogLevel >= 4) {
    console.debug(message);
  }
}

export function registerScreenSharingExtension(
  kind: string,
  id: string,
  version: number
) {
  console.debug("registerScreenSharingExtension: ", kind, id, version);
  return;
}

export default {
  checkSystemRequirements,
  upgradeSystemRequirements,
  getDevices,
  initSession,
  initPublisher,
};
