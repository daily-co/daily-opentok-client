// import * as OT from "@opentok/client";
// https://codepen.io/samuveljohns/pen/jOOoZvy
import {
  OTError,
  Event,
  Subscriber,
  Stream,
  SubscriberProperties,
} from "@opentok/client";
import Daily, { DailyCall, DailyEventObjectTrack } from "@daily-co/daily-js";
import { EventEmitter } from "events";

const ee = new EventEmitter();

type DailyStream = Stream & {
  dailyEvent: DailyEventObjectTrack;
};
export type StreamCreatedEvent = Event<"streamCreated", Session> & {
  stream: DailyStream;
};

type PublisherProps = OT.PublisherProperties & { dailyElementId?: string };

class Publisher {
  dailyElementId?: string;
  accessAllowed: boolean;
  width?: string;
  height?: string;
  insertMode?: "replace" | "after" | "before" | "append";
  constructor({ width, height, insertMode, dailyElementId }: PublisherProps) {
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;

    this.dailyElementId = dailyElementId;
    this.accessAllowed = true;
  }
  publish(targetElement: HTMLElement): Publisher {
    console.log("publisher.publish");
    return {} as Publisher;
  }
  once(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    console.log("once");
  }
}

class Session {
  sessionId: string;
  constructor(apiKey: string, sessionId: string, opt: any) {
    console.log("session constructor", apiKey, sessionId, opt);
    this.sessionId = sessionId;
  }
  on(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    ee.on(eventName, callback);
  }

  once(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    ee.once(eventName, callback);
  }
  publish(
    publisher: Publisher,
    callback?: (error?: OTError) => void
  ): Publisher {
    console.log("publish");
    if (!window.call) {
      console.error("No daily call object");
      return publisher;
    }

    window.call
      .join({
        url: this.sessionId,
      })
      .then((participants) => {
        console.debug("publish participants:", participants);
        if (!participants) return;

        const videoTrack = participants.local.videoTrack;
        if (!videoTrack) {
          console.debug("No local video track");
          return publisher;
        }

        let t =
          publisher.dailyElementId !== undefined
            ? document.getElementById(publisher.dailyElementId)
            : null;

        if (t === null) {
          console.log(t);
          t = document.createElement<"div">("div");
          document.body.appendChild(t);
        }

        let videoEl = t.getElementsByTagName("video")[0];

        if (!t.getElementsByTagName("video")[0]) {
          videoEl = document.createElement("video");
          t.appendChild(videoEl);
        }

        // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
        if (publisher.insertMode === "append") {
          t.appendChild(videoEl);
        }
        videoEl.style.width = publisher.width ?? "";
        videoEl.style.height = publisher.height ?? "";
        videoEl.srcObject = new MediaStream([videoTrack]);
        videoEl.play();
      })
      .catch((err) => {
        console.error(err);
      });

    return publisher;
  }
  connect(token: string, callback: (error?: OT.OTError) => void): void {
    if (!window.call) {
      console.error("No call");
      callback({
        message: "No call (todo find message)",
        name: "NoCall (todo find name)",
      });
      return;
    }

    callback();
  }
  subscribe(
    stream: DailyStream,
    targetElement?: string, // | HTMLElement,
    properties?: SubscriberProperties,
    callback?: (error?: OTError) => void
  ): Subscriber {
    console.log("subscribe.dailyEvent", stream.dailyEvent);
    if (!window.call) {
      console.error("No daily call object");
      return {} as Subscriber;
    }
    if (!targetElement) {
      console.error("No target element");
      return {} as Subscriber;
    }

    if (!stream.dailyEvent.participant) {
      console.error("No participant");
      return {} as Subscriber;
    }

    if (stream.dailyEvent.participant.local) {
      return {} as Subscriber;
    }

    const {
      dailyEvent: {
        participant: { user_id },
      },
    } = stream;

    const t = document.getElementById(targetElement) as HTMLElement;
    if (stream.hasVideo) {
      const videoEl =
        (document.getElementById(`video-${user_id}`) as HTMLVideoElement) ??
        document.createElement("video");
      videoEl.id = `video-${user_id}`;
      t.appendChild(videoEl);
      if (properties) {
        videoEl.style.width = properties.width?.toString() || "";
        videoEl.style.height = properties.height?.toString() || "";
      }
      videoEl.srcObject = new MediaStream([stream.dailyEvent.track]);
      videoEl.play();
    }

    if (stream.hasAudio) {
      const audioEl =
        (document.getElementById(`audio-${user_id}`) as HTMLAudioElement) ??
        document.createElement("audio");
      audioEl.id = `audio-${user_id}`;
      t.appendChild(audioEl);
      audioEl.srcObject = new MediaStream([stream.dailyEvent.track]);
      audioEl.play();
    }

    return {} as Subscriber;
  }
}

export function initSession(
  partnerId: string, // probably don't need the daily server API key here
  roomUrl: string, // originally sessionId
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
  window.call = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  window.call
    .on("track-started", (dailyEvent) => {
      // Maybe participant joined?
      console.debug("window.call.on track-started", dailyEvent);
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }

      if (dailyEvent.participant?.local) {
        console.debug("Local participant");
        return;
      }

      // Format as opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => true,
        preventDefault: () => {},
        target: {} as Session, //TODO fix this
        cancelable: false,
        stream: {
          // Maybe this is like participant id?
          streamId: dailyEvent.participant?.user_id || "",
          frameRate: 30,
          hasAudio: dailyEvent.track.kind === "audio",
          hasVideo: dailyEvent.track.kind === "video",
          name: "name",
          videoDimensions: {
            height: 720,
            width: 1280,
          },
          videoType: "camera",
          creationTime: new Date().getTime(),
          connection: {
            connectionId: "connectionId",
            creationTime: new Date().getTime(),
            data: "",
          },
          dailyEvent,
        },
      };

      ee.emit("streamCreated", streamEvent);
    })
    .on("track-stopped", (dailyEvent) => {})
    .on("error", (error) => {})
    .on("nonfatal-error", (error) => {})
    .on("network-connection", (dailyEvent) => {
      console.debug("network-connection", dailyEvent);
      if (!dailyEvent) {
        return;
      }

      switch (dailyEvent.event) {
        case "interrupted":
          const tokboxEvent: OT.Event<"sessionDisconnected", OT.Session> & {
            reason: string;
          } = {
            type: "sessionDisconnected",
            isDefaultPrevented: () => true,
            preventDefault: () => {},
            cancelable: false,
            target: {} as OT.Session, //TODO fix this
            reason: "networkDisconnected",
          };
          if (!tokboxEvent.isDefaultPrevented()) {
            // By default Tokbox removes all subscriber elements from the DOM
            // if the user calls `preventDefault` this behavior is prevented.
          }
          ee.emit("sessionDisconnected", tokboxEvent);
          break;
        case "connected":
          console.debug("connected");
          break;
        default:
          break;
      }
    })
    .on("network-quality-change", (dailyEvent) => {})
    .on("left-meeting", (dailyEvent) => {
      console.debug("left-meeting", dailyEvent);
      if (!dailyEvent) {
        return;
      }
      const tokboxEvent: OT.Event<"sessionDisconnected", OT.Session> & {
        reason: string;
      } = {
        type: "sessionDisconnected",
        isDefaultPrevented: () => false,
        preventDefault: () => {},
        cancelable: false,
        target: {} as OT.Session, //TODO fix this
        reason: "clientDisconnected",
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

      console.debug("participant-left v", v);
      if (v) {
        v.remove();
      }
    });

  const session = new Session(partnerId, roomUrl, options);
  return session;
}

export function initPublisher(
  targetElement?: string | undefined, // | HTMLElement,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OT.OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): Need checking to make sure that the target element is a valid element.

  const publisher = new Publisher({
    ...properties,
    dailyElementId: targetElement,
  });

  const err = null;

  if (err && callback) {
    callback(err);
  }

  return publisher;
}
