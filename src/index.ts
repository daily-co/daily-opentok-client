import { OTError, Stream } from "@opentok/client";
import Daily from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";
import { getParticipantTracks, mediaId, notImplemented } from "./utils";

export function checkSystemRequirements() {
  return Daily.supportedBrowser();
}

class Session {
  capabilities: {
    forceDisconnect: number;
    forceUnpublish: number;
    forceMute: number;
    publish: number;
    subscribe: number;
  };
  sessionId: string;
  connection?: OT.Connection;

  constructor(apiKey: string, sessionId: string, opt: any) {
    this.sessionId = sessionId;

    // TODO(jamsea): Figure out how to connect this to the daily call object
    // seems related to room tokens https://tokbox.com/developer/sdks/js/reference/Capabilities.html
    this.capabilities = {
      forceDisconnect: 1,
      forceUnpublish: 1,
      forceMute: 1,
      publish: 1,
      subscribe: 1,
    };
  }
  on(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    ee.on(eventName, callback);
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
    audioSource: properties?.audioSource,
    height: properties?.height ?? "",
    insertMode: properties?.insertMode,
    name: properties?.name,
    publishAudio: properties?.publishAudio,
    videoSource: properties?.videoSource,
    width: properties?.width ?? "",
  });

  const completionHandler =
    typeof callback === "function"
      ? callback
      : () => {
          // empty
        };

      if (!tokboxEvent.isDefaultPrevented()) {
        // By default Tokbox removes all subscriber elements from the DOM
        // if the user calls `preventDefault` this behavior is prevented.
      }

      ee.emit("sessionDisconnected", tokboxEvent);
    })
    .on("participant-left", (dailyEvent) => {
      if (!dailyEvent) return;

      const v = document.getElementById(
        `video-${dailyEvent.participant.user_id}`
      );
      if (v) {
        v.remove();
      }
    });

  console.log("window.call.meetingState()", window.call.meetingState());
  switch (window.call.meetingState()) {
    case "new":
      window.call.startCamera().catch((err) => {
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
    console.log("[index.ts] participant-updated: ", dailyEvent);
    if (!dailyEvent) {
      return;
    }

    const { participant } = dailyEvent;
    const {
      session_id,
      audio: hasAudio,
      video: hasVideo,
      screen,
      tracks,
      joined_at,
      user_id,
      local,
    } = participant;
    const creationTime = joined_at.getTime();

    const settings = tracks.video.track?.getSettings() ?? {};
    const { frameRate = 0, height = 0, width = 0 } = settings;
    const { video, screenVideo, screenAudio } =
      getParticipantTracks(participant);

    if (!local || !video) {
      return;
    }

    const stream: Stream = {
      streamId: session_id,
      frameRate,
      hasAudio,
      hasVideo,
      // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
      name: publisher.name,
      videoDimensions: {
        height,
        width,
      },
      videoType: screen ? "screen" : "camera", // Two sepearte events here...? Not sure what to do with this
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

    console.log(
      "-- screenVideo",
      screenVideo,
      mediaId(screenVideo, session_id)
    );
    const documentVideoElm = document.getElementById(
      mediaId(screenVideo, session_id)
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

  const err = null;

  if (err && callback) {
    callback(err);
  }

    videoEl.style.width = publisher.width ?? "";
    videoEl.style.height = publisher.height ?? "";
    videoEl.srcObject = new MediaStream([screenVideo]);

    videoEl.id = mediaId(screenVideo, session_id);
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
