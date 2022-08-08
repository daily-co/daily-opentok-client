import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
} from "@opentok/client";
import { DailyEventObjectTrack } from "@daily-co/daily-js";
import { OTEventEmitter } from "./OTEventEmitter";
import { Publisher } from "./Publisher";
import { Subscriber } from "./Subscriber";

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

  constructor(apiKey: string, sessionId: string, opt: any) {
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
  connect(token: string, callback: (error?: OTError) => void): void {
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
    stream: DailyStream | Stream,
    targetElement?: string | HTMLElement,
    properties?: SubscriberProperties,
    callback?: (error?: OTError) => void
  ): Subscriber {
    if (!window.call) {
      throw new Error("No daily call object");
    }

    if (!("dailyEvent" in stream)) {
      throw new Error("Wrong type of stream.");
    }

    if (!stream.dailyEvent.participant) {
      throw new Error("No daily participant object");
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

    const subscriber = new Subscriber(t);
    if (stream.dailyEvent.participant.local) {
      return subscriber;
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

    return subscriber;
  }
  disconnect(): void {
    throw new Error("Method not implemented.");
  }
  forceDisconnect(
    connection: OT.Connection,
    callback: (error?: OTError) => void
  ): void {
    throw new Error("Method not implemented.");
  }
  forceUnpublish(stream: Stream, callback: (error?: OTError) => void): void {
    throw new Error("Method not implemented.");
  }
  forceMuteStream(stream: Stream): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Method not implemented."));
    });
  }
  forceMuteAll(excludedStreams?: Stream[]): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Method not implemented."));
    });
  }
  getPublisherForStream(stream: Stream): Publisher | undefined {
    throw new Error("Method not implemented.");
  }
  getSubscribersForStream(stream: Stream): [Subscriber] {
    throw new Error("Method not implemented.");
  }
  off() {}
  setEncryptionSecret(secret: string): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Method not implemented."));
    });
  }
  signal(
    signal: { type?: string; data?: string; to?: OT.Connection },
    callback: (error?: OTError) => void
  ): void {
    throw new Error("Method not implemented.");
  }
  unpublish(publisher: Publisher): void {
    throw new Error("Method not implemented.");
  }
  unsubscribe(subscriber: Subscriber): void {
    throw new Error("Method not implemented.");
  }
}
