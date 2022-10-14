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
import { getParticipantTracks, getVideoTagID, notImplemented } from "./utils";

interface SessionCollection {
  length: () => number;
}

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
  /**
   * @deprecated use sessionId. This is to improve compatibility with opentok accelerator-core-js
   */
  id: string;
  connection?: OT.Connection;
  connections: SessionCollection = {
    length: () => {
      const { present, hidden } = window.call?.participantCounts() ?? {
        present: 0,
        hidden: 0,
      };

      return present + hidden;
    },
  };
  private reconnecting: boolean;
  private connectionCount = 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(apiKey: string, sessionId: string, opt: unknown) {
    super();
    this.sessionId = sessionId;
    this.id = this.sessionId;
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

    this.connection = {
      connectionId: "local",
      creationTime: new Date().getTime(),
      data: "",
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

    if (callback) {
      completionHandler = callback;
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
      const {
        session_id,
        audio,
        video,
        tracks,
        joined_at = new Date(),
        user_id,
      } = participant;
      const creationTime = joined_at.getTime();

      const settings = tracks.video.track?.getSettings() ?? {};
      const { frameRate = 0, height = 0, width = 0 } = settings;

      let defaultPrevented = false;

      type StreamCreatedEvent = Event<"streamCreated", Session> & {
        stream: Stream;
      };

      const connection = {
        connectionId: user_id,
        creationTime,
        data: "",
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
        connection,
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
      this.connection = connection;
      this.ee.emit("streamCreated", streamEvent);
    });
    completionHandler();
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

        const { joined_at = new Date(), user_id } = participant;

        const creationTime = joined_at.getTime();

        const connection = {
          connectionId: user_id,
          creationTime,
          // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
          // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
          data: "",
        };

        const connectionCreatedEvent: Event<"connectionCreated", Session> & {
          connection: Connection;
        } = {
          type: "connectionCreated",
          target: this,
          cancelable: true,
          connection,
          isDefaultPrevented: () => true,
          preventDefault: () => true,
        };

        this.connection = connection;

        this.ee.emit("connectionCreated", connectionCreatedEvent);
      })
      .on("track-stopped", (dailyEvent) => {
        if (!dailyEvent) return;
        if (!dailyEvent.participant) return;

        const {
          participant: { session_id },
        } = dailyEvent;

        // If it was video that stopped, hide the video element
        if (dailyEvent.track.kind === "video") {
          const v = document.getElementById(getVideoTagID(session_id));
          if (v) {
            v.style.visibility = "hidden";
          }
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
          reason: "clientDisconnected",
        };

        this.ee.emit("sessionDisconnected", tokboxEvent);

        const videos = document.getElementsByTagName("video");

        for (const video of videos) {
          if (video.id.includes("daily-video-")) {
            video.srcObject = null;
            video.remove();
          }
        }
      })
      .on("participant-left", (dailyEvent) => {
        if (!dailyEvent) return;

        const { participant } = dailyEvent;
        const {
          session_id,
          audio: hasAudio,
          video: hasVideo,
          tracks,
          joined_at = new Date(),
          user_id,
        } = participant;
        const creationTime = joined_at.getTime();

        const settings = tracks.video.track?.getSettings() ?? {};
        const { frameRate = 0, height = 0, width = 0 } = settings;

        const connection = {
          connectionId: user_id,
          creationTime,
          data: "",
        };

        let connectionDefaultPrevented = false;
        const connectionDestroyedEvent: Event<
          "connectionDestroyed",
          Session
        > & {
          connection: Connection;
          reason: string;
        } = {
          type: "connectionDestroyed",
          connection,
          isDefaultPrevented: () => connectionDefaultPrevented,
          preventDefault: () => {
            connectionDefaultPrevented = true;
          },
          cancelable: false,
          target: this,
          reason: "clientDisconnected",
        };

        this.ee.emit("connectionDestroyed", connectionDestroyedEvent);

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
          creationTime: joined_at.getTime(),
          connection,
        };

        let streamDefaultPrevented = true;
        const streamDestroyedEvent: Event<"streamDestroyed", Session> & {
          stream: Stream;
          reason: string;
        } = {
          type: "streamDestroyed",
          reason: "clientDisconnected",
          target: this,
          cancelable: true,
          stream,
          isDefaultPrevented: () => streamDefaultPrevented,
          preventDefault: () => {
            streamDefaultPrevented = true;
          },
        };

        this.ee.emit("streamDestroyed", streamDestroyedEvent);

        const v = document.getElementById(getVideoTagID(session_id));
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

      const isLocal = participant.local;

      // Get audio and video tracks from the participant
      const { audio, video } = getParticipantTracks(participant);
      if (!audio && !video) {
        return;
      }

      const { session_id } = participant;

      // Retrieve the existing video DOM element for this participant
      const existingVideoElement = document.getElementById(
        getVideoTagID(session_id)
      );

      // This will be the element we work with to retrieve/set tracks
      let videoEl: HTMLVideoElement;

      if (!existingVideoElement) {
        // If video DOM element does not already exist, create a new one
        videoEl = document.createElement("video");
        videoEl.id = getVideoTagID(session_id);

        if (properties && typeof properties !== "function") {
          videoEl.style.width = properties.width?.toString() ?? "";
          videoEl.style.height = properties.height?.toString() ?? "";
        }
        root.appendChild(videoEl);
      } else if (existingVideoElement instanceof HTMLVideoElement) {
        videoEl = existingVideoElement;
      } else {
        // If video element is on an unexpected type, error out
        return callback?.(new Error("Video element is invalid."));
      }

      const srcObject = videoEl.srcObject;
      // If source object is not already set, or is
      // some unsupported type, create a new MediaStream
      // and set it.
      if (!srcObject || !(srcObject instanceof MediaStream)) {
        const tracks: MediaStreamTrack[] = [];
        if (video) tracks.push(video);
        if (!isLocal && audio) tracks.push(audio);

        const newStream = new MediaStream(tracks);
        videoEl.srcObject = newStream;
        videoEl.autoplay = true;
        videoEl.onerror = (e) => {
          console.error("ERROR IN SESSION VIDEO ", e);
          if (typeof e === "string") {
            completionHandler?.(new Error(e));
          } else if (e instanceof Error) {
            completionHandler?.(e);
          }
        };
        return;
      }

      // If source object is an instance of MediaStream,
      // replace old tracks with new ones as needed
      if (srcObject instanceof MediaStream) {
        if (video) {
          this.updateVideoTrack(srcObject, video);
          videoEl.style.visibility = "visible";
        }
        if (!isLocal && audio) this.updateAudioTrack(srcObject, audio);
      } else {
        return callback?.(
          new Error("Video element's source object is invalid.")
        );
      }
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

  // updateAudioTrack() makes sure an existing stream is updated with
  // the given audio track.
  private updateAudioTrack(
    existingStream: MediaStream,
    newTrack: MediaStreamTrack
  ) {
    const existingTracks = existingStream.getAudioTracks();
    this.updateMediaTrack(existingStream, existingTracks, newTrack);
  }

  // updateVideoTrack() makes sure an existing stream is updated with
  // the given video track.
  private updateVideoTrack(
    existingStream: MediaStream,
    newTrack: MediaStreamTrack
  ) {
    const existingTracks = existingStream.getVideoTracks();
    this.updateMediaTrack(existingStream, existingTracks, newTrack);
  }

  // updateMediaTracks() compares existing media track IDs with new ones,
  // and replaces them if needed.
  private updateMediaTrack(
    existingStream: MediaStream,
    oldTracks: MediaStreamTrack[],
    newTrack: MediaStreamTrack
  ) {
    const trackCount = oldTracks.length;
    // If there are no old tracks,
    // add the new track.
    if (trackCount === 0) {
      existingStream.addTrack(newTrack);
      return;
    }

    if (trackCount > 1) {
      console.warn(
        `expected 1 track, but got ${trackCount}. Only using the first one.`
      );
    }
    const oldTrack = oldTracks[0];
    // If the IDs of the old and new track don't match,
    // replace the old track with the new one.
    if (oldTrack.id !== newTrack.id) {
      existingStream.removeTrack(oldTrack);
      existingStream.addTrack(newTrack);
    }
  }

  disconnect(): void {
    if (!window.call) {
      return;
    }

    // sessionDisconnected, connectionDestroyed, streamDestroyed are
    // all handled in listeners setup in connect(). In OpenTok's
    // implementation, this function does not throw any errors,
    // so to keep that behavior the same we're logging Daily
    // errors to the console.
    window.call.leave().catch((err) => {
      console.error(err);
    });
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
  unpublish(publisher: Publisher): void {
    publisher.session = undefined;
    if (!window.call) {
      return;
    }

    window.call.updateParticipant("local", {
      setVideo: false,
      setAudio: false,
    });
  }
  unsubscribe(subscriber: Subscriber): void {
    if (!window.call) {
      return;
    }

    const { stream: { streamId } = {} } = subscriber;

    if (streamId) {
      window.call.updateParticipant(streamId, {
        setSubscribedTracks: {
          audio: false,
          video: false,
          screenVideo: false,
          screenAudio: false,
        },
      });
    }
  }
}
