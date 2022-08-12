/* eslint-disable @typescript-eslint/no-unused-vars */
import Daily, { DailyEventObjectParticipant } from "@daily-co/daily-js";
import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
  PublisherProperties,
} from "@opentok/client";
import { DailyEventObjectTrack } from "@daily-co/daily-js";
import { OTEventEmitter } from "./OTEventEmitter";
import { Publisher } from "./Publisher";
import { Subscriber } from "./Subscriber";
import { notImplemented } from ".";

type DailyStream = Stream & {
  dailyEvent: DailyEventObjectTrack;
};

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
      throw new Error("Not yet implemented");
    }

    if (!window.call) {
      console.error("No daily call object");
      callback?.({
        message: "No call",
        name: "NoCall",
      });
      return publisher;
    }

    // this.sessionId

    const participants = window.call.participants();

    console.debug("publish participants:", participants);

    // const videoTrack = participants.local.videoTrack;
    // if (!videoTrack) {
    //   console.debug("No local video track");
    //   return publisher;
    // }

    // let t =
    //   publisher.dailyElementId !== undefined
    //     ? (document.getElementById(publisher.dailyElementId) as HTMLDivElement)
    //     : null;

    // if (t === null) {
    //   t = document.createElement("div");
    //   document.body.appendChild(t);
    // }

    // const videoElements = t.getElementsByTagName("video");

    // const videoEl =
    //   videoElements.length > 0
    //     ? videoElements[0]
    //     : document.createElement<"video">("video");

    // // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
    // if (publisher.insertMode === "append") {
    //   t.appendChild(videoEl);
    // }
    // videoEl.style.width = publisher.width ?? "";
    // videoEl.style.height = publisher.height ?? "";
    // videoEl.srcObject = new MediaStream([videoTrack]);
    // videoEl.play().catch((e) => {
    //   console.error(e);
    // });

    return publisher;
  }
  connect(token: string, callback: (error?: OTError) => void): void {
    window.call =
      window.call != undefined
        ? window.call
        : Daily.createCallObject({
            subscribeToTracksAutomatically: false,
            dailyConfig: {
              experimentalChromeVideoMuteLightOff: true,
            },
          });

    window.call
      .on("started-camera", (participant) => {
        console.log("started-camera", participant);
      })
      .on("participant-joined", (dailyEvent) => {
        if (!dailyEvent) {
          console.debug("No Daily event");
          return;
        }

        // if (dailyEvent.participant.local) {
        //   console.debug(
        //     "Local participant, do not fire opentok subscriber event."
        //   );
        //   return;
        // }

        const {
          participant: { session_id },
        } = dailyEvent;

        // window.call?.updateParticipant(session_id, {
        //   setSubscribedTracks: {
        //     audio: true,
        //     video: true,
        //     screenVideo: false,
        //     screenAudio: false,
        //   },
        // });

        const settings =
          dailyEvent.participant.tracks.video.track?.getSettings() ?? {};

        const { frameRate = 0, height = 0, width = 0 } = settings;

        const creationTime = dailyEvent.participant.joined_at.getTime();

        let defaultPrevented = false;

        type DailyStream = Stream & {
          dailyEvent: DailyEventObjectParticipant;
        };
        type StreamCreatedEvent = Event<"streamCreated", Session> & {
          stream: DailyStream;
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
            // Append the Daily Event to the stream object so customers can "break out" of opentok if they want to
            dailyEvent,
          },
        };

        this.ee.emit("streamCreated", streamEvent);
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
          `video-${dailyEvent.participant.user_id}`
        );
        if (v) {
          v.remove();
        }
      })
      .join({ url: this.sessionId, token })
      .catch((e) => {
        console.error(e);
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
      callback?.({
        message: "No target element",
        name: "NoTargetElement",
      });
      throw new Error("No target element");
    }

    const { streamId } = stream;

    const t =
      targetElement instanceof HTMLElement
        ? targetElement
        : document.getElementById(targetElement);

    if (!t) {
      throw new Error("No target element");
    }

    const subscriber = new Subscriber(t);

    window.call
      .updateParticipant(streamId, {
        setSubscribedTracks: {
          audio: stream.hasAudio,
          video: stream.hasVideo,
          screenVideo: false,
          screenAudio: false,
        },
      })
      .on("participant-updated", (dailyEvent) => {
        console.log("--- [participant-updated]", dailyEvent);

        if (dailyEvent?.participant.local) {
          console.log("-------- [participant-updated] local", dailyEvent);
        }

        if (!dailyEvent) {
          return;
        }

        window.call?.updateParticipant(dailyEvent.participant.session_id, {
          setSubscribedTracks: {
            audio: dailyEvent.participant.audio,
            video: dailyEvent.participant.video,
            screenVideo: false,
            screenAudio: false,
          },
        });
      })
      .on("track-started", (dailyEvent) => {
        console.log("TRACK STARTED");
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
        if (dailyEvent.participant.videoTrack) {
          const streamId = dailyEvent.participant.session_id;
          const documentVideoElm = document.getElementById(`video-${streamId}`);

          const videoEl =
            documentVideoElm instanceof HTMLVideoElement
              ? documentVideoElm
              : document.createElement("video");

          videoEl.id = `video-${streamId}`;
          t.appendChild(videoEl);
          if (properties) {
            videoEl.style.width = properties.width?.toString() ?? "";
            videoEl.style.height = properties.height?.toString() ?? "";
          }
          videoEl.srcObject = new MediaStream([
            dailyEvent.participant.videoTrack,
          ]);
          videoEl.play().catch((e) => {
            console.error("ERROR IN SESSION VIDEO");

            console.error(e);
          });
        }

        if (dailyEvent.participant.audioTrack) {
          const documentAudioElm = document.getElementById(`audio-${streamId}`);

          const audioEl =
            documentAudioElm instanceof HTMLAudioElement
              ? documentAudioElm
              : document.createElement("audio");

          audioEl.id = `audio-${streamId}`;
          t.appendChild(audioEl);
          audioEl.srcObject = new MediaStream([
            dailyEvent.participant.audioTrack,
          ]);
          audioEl.play().catch((e) => {
            console.error("ERROR IN SESSION AUDIO");

            console.error(e);
          });
        }
      });

    return subscriber;
  }
  disconnect(): void {
    notImplemented();
  }
  forceDisconnect(
    connection: OT.Connection,
    callback: (error?: OTError) => void
  ): void {
    notImplemented();
  }
  forceUnpublish(stream: Stream, callback: (error?: OTError) => void): void {
    notImplemented();
  }
  forceMuteStream(stream: Stream): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  forceMuteAll(excludedStreams?: Stream[]): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  getPublisherForStream(stream: Stream): Publisher | undefined {
    notImplemented();
  }
  getSubscribersForStream(stream: Stream): [Subscriber] {
    notImplemented();
  }
  setEncryptionSecret(secret: string): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  signal(
    signal: { type?: string; data?: string; to?: OT.Connection },
    callback: (error?: OTError) => void
  ): void {
    notImplemented();
  }
  unpublish(publisher: Publisher): void {
    notImplemented();
  }
  unsubscribe(subscriber: Subscriber): void {
    notImplemented();
  }
}
