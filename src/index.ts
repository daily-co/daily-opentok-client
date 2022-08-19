import { OTError, Stream } from "@opentok/client";
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
  console.log("--- initPublisher", targetElement, properties, callback);
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

  console.log("window.call.meetingState()", window.call.meetingState());
  switch (window.call.meetingState()) {
    case "new":
      window.call.startCamera().catch((err) => {
        console.error("startCamera error: ", err);
      });
      break;
    case "loading":
      break;
    case "loaded":
      console.log("loaded");
      break;
    case "joining-meeting":
      console.log("joining-meeting");
      break;
    case "joined-meeting":
      console.log("joined-meeting");
      break;
    case "left-meeting":
      console.log("left-meeting");
      break;
    case "error":
      console.log("error");
      break;
    default:
      break;
  }

  window.call.on("participant-updated", (dailyEvent) => {
    console.log("participant-updated: ", dailyEvent);
    if (!dailyEvent) {
      return;
    }

    const { participant } = dailyEvent;
    const {
      session_id,
      audio: hasAudio,
      video: hasVideo,
      tracks,
      joined_at,
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

    // type StreamCreatedEvent = OT.Event<"streamCreated", Session> & {
    //   stream: Stream;
    // };

    // const streamEvent: StreamCreatedEvent = {
    //   type: "streamCreated",
    //   isDefaultPrevented: () => true,
    //   preventDefault: () => true,
    //   target: null,
    //   cancelable: true,
    //   stream,
    // };

    // publisher.ee.emit("streamCreated", streamEvent);

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

    if (videoEl.srcObject && "getTracks" in videoEl.srcObject) {
      const tracks = videoEl.srcObject.getTracks();
      console.log("local tracks", tracks);
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

export default {
  checkSystemRequirements,
  upgradeSystemRequirements,
  getDevices,
  initSession,
  initPublisher,
};
