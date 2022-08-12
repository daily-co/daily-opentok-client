import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
  PublisherProperties,
} from "@opentok/client";
import { OTEventEmitter } from "./OTEventEmitter";
import { Publisher } from "./Publisher";
import { Subscriber } from "./Subscriber";
import { getParticipantTracks, mediaId, notImplemented } from "./utils";

export class Session extends OTEventEmitter<{
  archiveStarted: Event<"archiveStarted", Session> & {
    id: string;
    name: string;
  };

  archiveStopped: Event<"archiveStopped", Session> & {
    id: string;
    name: string;
  };

  connectionCreated: Event<"connectionCreated", Session> & {
    connection: Connection;
  };

  connectionDestroyed: Event<"connectionDestroyed", Session> & {
    connection: Connection;
    reason: string;
  };

  sessionConnected: Event<"sessionConnected", Session>;

  sessionDisconnected: Event<"sessionDisconnected", Session> & {
    reason: string;
  };

  sessionReconnected: Event<"sessionReconnected", Session>;
  sessionReconnecting: Event<"sessionReconnecting", Session>;

  signal: Event<"signal", Session> & {
    type?: string;
    data?: string;
    from: OT.Connection | null;
  };

  streamCreated: Event<"streamCreated", Session> & {
    stream: Stream;
  };

  streamDestroyed: Event<"streamDestroyed", Session> & {
    stream: Stream;
    reason: string;
  };

  streamPropertyChanged: Event<"streamPropertyChanged", Session> & {
    stream: Stream;
  } & (
      | { changedProperty: "hasAudio"; oldValue: boolean; newValue: boolean }
      | { changedProperty: "hasVideo"; oldValue: boolean; newValue: boolean }
      | {
          changedProperty: "videoDimensions";
          oldValue: OT.Dimensions;
          newValue: OT.Dimensions;
        }
    );

  muteForced: Event<"muteForced", Session>;
}> {
  capabilities: {
    forceDisconnect: number;
    forceUnpublish: number;
    forceMute: number;
    publish: number;
    subscribe: number;
  };
  sessionId: string;
  connection?: OT.Connection;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(apiKey: string, sessionId: string, opt: unknown) {
    super();
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

  publish(
    publisher: Publisher,
    callback?: (error?: OTError) => void
  ): Publisher;

  publish(
    targetElement: string | HTMLElement,
    properties?: PublisherProperties,
    callback?: (error?: OTError) => void
  ): Publisher;

  publish(
    publisher: string | HTMLElement | Publisher,
    properties?: ((error?: OTError) => void) | PublisherProperties,
    callback?: (error?: OTError) => void
  ): Publisher {
    if (typeof publisher === "string" || publisher instanceof HTMLElement) {
      notImplemented();
    }

    if (!window.call) {
      console.error("No daily call object");
      callback?.({
        message: "No call",
        name: "NoCall",
      });
      return publisher;
    }

    window.call.on("participant-joined", (dailyEvent) => {
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }

      const settings =
        dailyEvent.participant.tracks.video.track?.getSettings() ?? {};

      const { frameRate = 0, height = 0, width = 0 } = settings;

      const creationTime = dailyEvent.participant.joined_at.getTime();

      let defaultPrevented = false;

      type StreamCreatedEvent = Event<"streamCreated", Session> & {
        stream: Stream;
      };

      // Format as an opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          defaultPrevented = true;
        },
        target: this,
        cancelable: true,
        stream: {
          streamId: dailyEvent.participant.session_id,
          frameRate,
          hasAudio: dailyEvent.participant.audio,
          hasVideo: dailyEvent.participant.video,
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
            data: "",
          },
        },
      };

      this.ee.emit("streamCreated", streamEvent);
    });

    return publisher;
  }
  connect(token: string, callback: (error?: OTError) => void): void {
    if (!window.call) {
      throw new Error("No call object");
    }

    window.call
      .on("started-camera", (participant) => {
        console.log("started-camera", participant);
      })
      .on("track-stopped", () => {
        // TODO(jamsea): emit streamDestroyed event
      })
      .on("error", () => {
        // TODO(jamsea): emit error event
      })
      .on("nonfatal-error", () => {
        // TODO(jamsea): emit error event
      })
      .on("network-connection", (dailyEvent) => {
        console.debug("network-connection", dailyEvent);
        if (!dailyEvent) {
          return;
        }

        let defaultPrevented = false;
        const tokboxEvent: Event<"sessionDisconnected", Session> & {
          reason: string;
        } = {
          type: "sessionDisconnected",
          isDefaultPrevented: () => defaultPrevented,
          preventDefault: () => {
            defaultPrevented = true;
          },
          cancelable: true,
          target: this,
          reason: "networkDisconnected",
        };

        switch (dailyEvent.event) {
          case "interrupted":
            this.ee.emit("sessionDisconnected", tokboxEvent);
            break;
          case "connected":
            console.debug("connected");
            break;
          default:
            break;
        }
      })
      .on("network-quality-change", () => {
        // TODO(jamsea): emit networkQualityChange event
      })
      .on("left-meeting", (dailyEvent) => {
        console.debug("left-meeting", dailyEvent);
        if (!dailyEvent) {
          return;
        }

        let defaultPrevented = false;

        const tokboxEvent: Event<"sessionDisconnected", OT.Session> & {
          reason: string;
        } = {
          type: "sessionDisconnected",
          isDefaultPrevented: () => defaultPrevented,
          preventDefault: () => {
            defaultPrevented = true;
          },
          cancelable: true,
          target: this,
          reason: "clientDisconnected",
        };

        this.ee.emit("sessionDisconnected", tokboxEvent);
      })
      .on("participant-left", (dailyEvent) => {
        if (!dailyEvent) return;

        const v = document.getElementById(
          `audio-video-${dailyEvent.participant.session_id}`
        );
        if (v) {
          v.remove();
        }
      })
      .join({ url: this.sessionId, token })
      .then(() => {
        // Call the completion callback after the call has been joined
        callback();
      })
      .catch((e) => {
        if (typeof e === "string") {
          callback({
            message: e.toUpperCase(),
            name: "error",
          });
        } else if (e instanceof Error) {
          callback({
            message: e.message,
            name: e.name,
          });
        }
      });
  }
  subscribe(
    stream: Stream,
    targetElement?: string | HTMLElement,
    properties?: SubscriberProperties,
    callback?: (error?: OTError) => void
  ): Subscriber {
    if (!window.call) {
      throw new Error("No daily call object");
    }
    console.log("SUBSCRIBE");

    if (!targetElement) {
      const err = new Error("No target element");
      callback?.(err);
      throw err;
    }

    const { streamId } = stream;

    const t =
      targetElement instanceof HTMLElement
        ? targetElement
        : document.getElementById(targetElement);

    if (!t) {
      const err = new Error("No target element");
      callback?.(err);
      throw err;
    }

    const subscriber = new Subscriber(t);

    window.call.on("track-started", (dailyEvent) => {
      // Make sure the track has started before publishing the session
      // TODO(jamsea): need to figure out the error handling here.

      if (!dailyEvent) {
        console.debug("track-started no daily event");
        return;
      }

      if (!dailyEvent.participant) {
        console.debug("track-started no participant");
        return;
      }

      const { audio, video } = getParticipantTracks(dailyEvent.participant);
      const tracks: MediaStreamTrack[] = [];
      if (video) tracks.push(video);
      if (audio) tracks.push(audio);
      const stream = new MediaStream(tracks);

      const streamId = dailyEvent.participant.session_id;
      const documentVideoElm = document.getElementById(
        mediaId`${stream}-${streamId}`
      );

      if (documentVideoElm) {
        return;
      }

      const videoEl = document.createElement("video");

      t.appendChild(videoEl);
      if (properties) {
        videoEl.style.width = properties.width?.toString() ?? "";
        videoEl.style.height = properties.height?.toString() ?? "";
      }
      if (tracks.length > 0) {
        videoEl.srcObject = stream;
        videoEl.id = mediaId`${stream}-${streamId}`;
      }
      videoEl.play().catch((e) => {
        console.error("ERROR IN SESSION VIDEO", e);
      });
    });

    window.call.updateParticipant(streamId, {
      setSubscribedTracks: {
        audio: true,
        video: true,
        screenVideo: false,
        screenAudio: false,
      },
    });

    return subscriber;
  }
  disconnect(): void {
    notImplemented();
  }
  forceDisconnect(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    connection: OT.Connection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError) => void
  ): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forceUnpublish(stream: Stream, callback: (error?: OTError) => void): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forceMuteStream(stream: Stream): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  forceMuteAll(excludedStreams?: Stream[]): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getPublisherForStream(stream: Stream): Publisher | undefined {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getSubscribersForStream(stream: Stream): [Subscriber] {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setEncryptionSecret(secret: string): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  signal(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signal: { type?: string; data?: string; to?: OT.Connection },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError) => void
  ): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unpublish(publisher: Publisher): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unsubscribe(subscriber: Subscriber): void {
    notImplemented();
  }
}
