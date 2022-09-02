import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
  PublisherProperties,
  ExceptionEvent,
} from "@opentok/client";
import Daily from "@daily-co/daily-js";
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
  private reconnecting: boolean;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(apiKey: string, sessionId: string, opt: unknown) {
    super();
    this.sessionId = sessionId;
    this.reconnecting = false;

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
    let completionHandler: ((error?: OTError) => void) | undefined = callback;

    if (typeof publisher === "function") {
      completionHandler = publisher;
    }

    if (typeof properties === "function") {
      completionHandler = properties;
      properties = undefined;
    }

    if (!completionHandler) {
      completionHandler = () => {
        // intentionally empty function
      };
    }

    if (typeof publisher === "string" || publisher instanceof HTMLElement) {
      notImplemented();
    }

    if (!window.call) {
      console.error("No daily call object");
      completionHandler({
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
      const { participant } = dailyEvent;
      const { session_id, audio, video, tracks, joined_at, user_id } =
        participant;
      const creationTime = joined_at.getTime();

      const settings = tracks.video.track?.getSettings() ?? {};
      const { frameRate = 0, height = 0, width = 0 } = settings;

      let defaultPrevented = false;

      type StreamCreatedEvent = Event<"streamCreated", Session> & {
        stream: Stream;
      };

      const stream: Stream = {
        streamId: session_id,
        frameRate,
        hasAudio: audio,
        hasVideo: video,
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

      // Format as an opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          defaultPrevented = true;
        },
        target: this,
        cancelable: true,
        stream,
      };

      publisher.stream = stream;
      this.ee.emit("streamCreated", streamEvent);
    });

    return publisher;
  }
  connect(token: string, callback: (error?: OTError) => void): void {
    window.call =
      window.call ??
      Daily.createCallObject({
        subscribeToTracksAutomatically: false,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });

    window.call
      .on("participant-joined", (dailyEvent) => {
        // Fires for REMOTE participants only
        if (!dailyEvent) {
          return;
        }
        const { participant } = dailyEvent;

        const { joined_at, user_id } = participant;

        const creationTime = joined_at.getTime();

        const connectionCreatedEvent: Event<"connectionCreated", Session> & {
          connection: Connection;
        } = {
          type: "connectionCreated",
          target: this,
          cancelable: true,
          connection: {
            connectionId: user_id,
            creationTime,
            // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
            // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
            data: "",
          },
          isDefaultPrevented: () => true,
          preventDefault: () => true,
        };

        this.ee.emit("connectionCreated", connectionCreatedEvent);
      })
      .on("started-camera", (participant) => {
        console.debug("started-camera", participant);
      })
      .on("track-stopped", (dailyEvent) => {
        // TODO(jamsea): emit streamDestroyed event
        if (!dailyEvent) return;
        if (!dailyEvent.participant) return;

        this.ee.emit("connectionDestroyed");

        const {
          participant: { session_id },
        } = dailyEvent;

        const v = document.getElementById(mediaId("audio-video", session_id));
        if (v) {
          v.remove();
        }
      })
      .on("error", (dailyEvent) => {
        console.error("error", dailyEvent);

        const exceptionEvent: ExceptionEvent = {
          // TODO: Map out the error codes (https://tokbox.com/developer/sdks/js/reference/ExceptionEvent.html)
          code: 2000,
          message: dailyEvent?.error?.localizedMsg ?? "",
          title: dailyEvent?.error?.type ?? "",
          preventDefault: () => true,
          isDefaultPrevented: () => true,
          type: "exception",
          cancelable: false,
          target: this,
        };

        this.ee.emit("exception", exceptionEvent);
      })
      .on("nonfatal-error", (dailyEvent) => {
        console.error("error", dailyEvent);

        const exceptionEvent: ExceptionEvent = {
          // TODO: Map out the error codes (https://tokbox.com/developer/sdks/js/reference/ExceptionEvent.html)
          code: 2000,
          message: dailyEvent?.errorMsg ?? "",
          title: dailyEvent?.type ?? "",
          preventDefault: () => true,
          isDefaultPrevented: () => true,
          type: "exception",
          cancelable: false,
          target: this,
        };

        this.ee.emit("exception", exceptionEvent);
      })
      .on("network-connection", (dailyEvent) => {
        console.debug("network-connection", dailyEvent);
        if (!dailyEvent) {
          return;
        }
        const { event } = dailyEvent;

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

        switch (event) {
          case "interrupted":
            this.ee.emit("sessionReconnecting", tokboxEvent);
            this.reconnecting = true;
            break;
          case "connected":
            if (this.reconnecting) {
              this.ee.emit("sessionReconnected", tokboxEvent);
              this.reconnecting = false;
            }
            break;
          default:
            break;
        }
      })
      .on("network-quality-change", (dailyEvent) => {
        if (!dailyEvent) {
          return;
        }
        // TODO(jamsea): emit opentok event
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

        this.ee.emit("connectionDestroyed");

        const {
          participant: { session_id },
        } = dailyEvent;

        const v = document.getElementById(mediaId("audio-video", session_id));
        if (v) {
          v.remove();
        }
      })
      .join({ url: this.sessionId, token })
      .then((dailyEvent) => {
        if (!dailyEvent) {
          return;
        }
        const sessionConnectedEvent: Event<"sessionConnected", Session> = {
          type: "sessionConnected",
          target: this,
          cancelable: true,
          isDefaultPrevented: () => true,
          preventDefault: () => true,
        };
        this.ee.emit("sessionConnected", sessionConnectedEvent);
        callback();
      })
      .catch((e) => {
        if (typeof e === "string") {
          callback(new Error(e));
        } else if (e instanceof Error) {
          callback(e);
        }
      });
  }
  subscribe(
    stream: Stream,
    targetElement?: string | HTMLElement,
    properties?: SubscriberProperties | ((error?: OTError) => void),
    callback?: (error?: OTError) => void
  ): Subscriber {
    if (!window.call) {
      throw new Error("No daily call object");
    }

    let completionHandler: ((error?: OTError) => void) | undefined = undefined;

    if (typeof targetElement === "function") {
      completionHandler = targetElement;
      targetElement = undefined;
      properties = undefined;
    }

    if (typeof properties === "function") {
      completionHandler = properties;
      properties = undefined;
    }

    if (!completionHandler) {
      completionHandler = () => {
        // intentionally empty
      };
    }

    if (!targetElement) {
      const err = new Error("No target element");
      completionHandler(err);
      throw err;
    }

    const { streamId } = stream;

    const root =
      targetElement instanceof HTMLElement
        ? targetElement
        : document.getElementById(targetElement);

    if (!root) {
      const err = new Error("No target element");
      completionHandler(err);
      throw err;
    }

    const subscriber = new Subscriber(root);

    window.call.on("track-started", (dailyEvent) => {
      // Make sure the track has started before publishing the session
      // TODO(jamsea): need to figure out the error handling here.

      if (!dailyEvent) {
        console.debug("track-started no daily event");
        return;
      }

      const { participant } = dailyEvent;
      if (!participant) {
        return;
      }

      const { audio, video } = getParticipantTracks(participant);
      const tracks: MediaStreamTrack[] = [];
      if (video) tracks.push(video);
      if (audio) tracks.push(audio);
      tracks.sort((a, b) => a.id.localeCompare(b.id));
      const stream = new MediaStream(tracks);

      const { session_id } = participant;
      const documentVideoElm = document.getElementById(
        mediaId(stream, session_id)
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
        const domTracks = videoEl.srcObject.getTracks();

        if (domTracks.find((t) => t.id === tracks[0].id)) {
          return;
        }
      }

      if (properties && typeof properties !== "function") {
        videoEl.style.width = properties.width?.toString() ?? "";
        videoEl.style.height = properties.height?.toString() ?? "";
      }
      if (tracks.length > 0) {
        videoEl.srcObject = stream;
        videoEl.id = mediaId(stream, session_id);
      }

      root.appendChild(videoEl);

      videoEl.play().catch((e) => {
        console.error("ERROR IN SESSION VIDEO ", e);
        if (typeof e === "string") {
          completionHandler?.(new Error(e));
        } else if (e instanceof Error) {
          completionHandler?.(e);
        }
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
