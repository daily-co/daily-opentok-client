import {
  OTError,
  Event,
  Subscriber,
  Stream,
  SubscriberProperties,
  VideoFilter,
  PublisherStatsArr,
  PublisherRtcStatsReportArr,
  PublisherProperties,
} from "@opentok/client";
import Daily, { DailyEventObjectTrack } from "@daily-co/daily-js";
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

  on(eventName: any, callback: any, context?: any): void {
    throw new Error("Not implemented");
  }

  off(eventName?: any, callback?: any, context?: any): void {
    throw new Error("Not implemented");
  }

  once(eventName: any, callback: any, context?: any): void {
    throw new Error("Not implemented");
  }
  destroy(): void {}
  getImgData(): string | null {
    return null;
  }
  getStats(
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {}
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getStyle(): PublisherProperties {
    throw new Error("Not implemented");
  }
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getVideoFilter(): VideoFilter | null {
    return null;
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  publishAudio(value: boolean): void {
    throw new Error("Not implemented");
  }
  publishVideo(value: boolean): void {
    throw new Error("Not implemented");
  }
  publishCaptions(value: boolean): void {
    throw new Error("Not implemented");
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getAudioSource(): MediaStreamTrack {
    throw new Error("Not implemented");
  }
  setVideoSource(videoSourceId: string): Promise<undefined> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getVideoContentHint(): OT.VideoContentHint {
    throw new Error("Not implemented");
  }
  setVideoContentHint(hint: OT.VideoContentHint): void {}
  getVideoSource(): {
    deviceId: string | null;
    type: string | null;
    track: MediaStreamTrack | null;
  } {
    throw new Error("Not implemented");
  }
  setStyle<Style extends keyof OT.PublisherStyle>(
    style: Style,
    value: OT.PublisherStyle[Style]
  ): void {
    throw new Error("Not implemented");
  }
  videoWidth(): number | undefined {
    throw new Error("Not implemented");
  }
  videoHeight(): number | undefined {
    throw new Error("Not implemented");
  }
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
  ): void;

  on(eventMap: object, context?: object): void;

  on(eventName: string | object, callback: any, context?: object): void {
    if (typeof eventName === "string") {
      ee.on(eventName, callback);
    }
  }

  once(eventName: any, callback: any, context?: any): void {
    if (typeof eventName !== "string") {
      throw new Error("eventName must be a string");
    }
    if (typeof callback !== "function") {
      throw new Error("callback must be a function");
    }
    ee.once(eventName, callback);
  }

  publish(
    publisher: Publisher,
    callback?: (error?: OTError) => void
  ): Publisher;

  publish(
    targetElement: string | HTMLElement,
    properties?: OT.PublisherProperties,
    callback?: (error?: OTError) => void
  ): Publisher;

  publish(
    publisher: string | HTMLElement | Publisher,
    properties?: any,
    callback?: (error?: OTError) => void
  ): Publisher {
    if (typeof publisher === "string" || publisher instanceof HTMLElement) {
      throw new Error("Not yet implemented");
    }

    if (!window.call) {
      console.error("No daily call object");
      return publisher as Publisher;
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
    targetElement?: string | HTMLElement,
    properties?: SubscriberProperties,
    callback?: (error?: OTError) => void
  ): Subscriber {
    console.log("subscribe.dailyEvent", stream.dailyEvent);
    if (!window.call) {
      throw new Error("No daily call object");
    }

    if (!stream.dailyEvent.participant) {
      throw new Error("No daily participant object");
    }

    if (stream.dailyEvent.participant.local) {
      return {} as Subscriber;
    }

    if (!targetElement) {
      throw new Error("No target element");
    }

    const {
      dailyEvent: {
        participant: { user_id },
      },
    } = stream;

    const t =
      targetElement instanceof HTMLElement
        ? targetElement
        : document.getElementById(targetElement);

    if (!t) {
      throw new Error("No target element");
    }

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
  disconnect(): void {}
  forceDisconnect(
    connection: OT.Connection,
    callback: (error?: OTError) => void
  ): void {}
  forceUnpublish(stream: Stream, callback: (error?: OTError) => void): void {}
  forceMuteStream(stream: Stream): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  forceMuteAll(excludedStreams?: Stream[]): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  getPublisherForStream(stream: Stream): OT.Publisher | undefined {
    return undefined;
  }
  getSubscribersForStream(stream: Stream): [Subscriber] {
    return [{}] as [Subscriber];
  }
  off() {}
  setEncryptionSecret(secret: string): Promise<void> {
    return new Promise((resolve, reject) => {
      resolve();
    });
  }
  signal(
    signal: { type?: string; data?: string; to?: OT.Connection },
    callback: (error?: OTError) => void
  ): void {}
  unpublish(publisher: Publisher): void {}
  unsubscribe(subscriber: Subscriber): void {}
}

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
  const session: OT.Session = new Session(partnerId, roomUrl, options);

  window.call = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  window.call
    .on("track-started", (dailyEvent) => {
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }

      if (dailyEvent.participant?.local) {
        console.debug("Local participant, do not fire opentok event.");
        return;
      }

      const {
        frameRate = 0,
        height = 0,
        width = 0,
      } = dailyEvent.track.getSettings();

      const creationTime = dailyEvent.participant?.joined_at
        ? dailyEvent.participant.joined_at.getTime()
        : new Date().getTime();

      let defaultPrevented = false;
      const cancelable = true;

      // Format as opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          if (cancelable) {
            defaultPrevented = true;
          } else {
            console.warn(
              "Event.preventDefault :: Trying to preventDefault on an " +
                "event that isn't cancelable"
            );
          }
        },
        target: session,
        cancelable,
        stream: {
          // Maybe this is like user_id in daily?
          streamId: dailyEvent.participant?.user_id || "",
          frameRate,
          hasAudio: dailyEvent.track.kind === "audio",
          hasVideo: dailyEvent.track.kind === "video",
          // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
          name: "",
          videoDimensions: {
            height,
            width,
          },
          videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
          creationTime,
          connection: {
            connectionId: "connectionId", // TODO
            creationTime,
            // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
            // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
            // we need to listen to participant-joined instead of track-started
            data: "",
          },
          // Append the Daily Event to the stream object so customers can "break out" of opentok if they want to
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
            isDefaultPrevented: () => true, //TODO
            preventDefault: () => {},
            cancelable: false,
            target: session,
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
        target: session,
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
      if (v) {
        v.remove();
      }
    });

  return session;
}

export function initPublisher(
  targetElement?: string | undefined, // | HTMLElement,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OT.OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): initPublisher function signature needs
  // all of it's edge cases checked (e.g. no targetElement, no properties, etc)
  const publisher = new Publisher({
    width: properties?.width || "100%",
    height: properties?.height || "100%",
    insertMode: properties?.insertMode,
    dailyElementId: targetElement,
  });

  const err = null;

  if (err && callback) {
    callback(err);
  }

  return publisher;
}
