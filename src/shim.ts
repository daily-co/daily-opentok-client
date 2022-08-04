// import * as OT from "@opentok/client";
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

interface PublisherProps {
  dailyElementId: string;
}

class Publisher {
  dailyElementId: string;
  accessAllowed: boolean;
  constructor(properties: PublisherProps) {
    console.log("publisher constructor", properties);

    this.dailyElementId = properties.dailyElementId;
    this.accessAllowed = true;
  }
  publish(targetElement: HTMLElement): Publisher {
    if (!window.call) {
      console.error("todo publisher error handling");
      return {} as Publisher;
    }

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
  constructor(apiKey: string, sessionId: string, opt: any) {
    console.log("session constructor", apiKey, sessionId, opt);
  }
  on(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    ee.on(eventName, callback);
    console.debug(
      "ee.listenerCount: " + eventName,
      ee.listenerCount(eventName)
    );
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
        url: "https://hush.daily.co/demo",
      })
      .then((participants) => {
        console.debug("publish participants:", participants);
        if (!participants) return;

        const videoTrack = participants.local.videoTrack;
        if (!videoTrack) {
          console.debug("No local video track");
          return publisher;
        }

        const t = document.getElementById(
          publisher.dailyElementId
        ) as HTMLElement;
        const videoEl = document.createElement("video");
        t.appendChild(videoEl);
        videoEl.style.width = "100%";
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
    const videoEl =
      (document.getElementById(user_id) as HTMLVideoElement) ??
      document.createElement("video");
    videoEl.id = stream.dailyEvent.participant.user_id;
    t.appendChild(videoEl);
    videoEl.style.width = "100%";
    videoEl.srcObject = new MediaStream([stream.dailyEvent.track]);
    videoEl.play();
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
  // let session = sessionObjects.sessions.get(sessionId);

  // if (!session) {
  //   // session = new Session(apiKey, sessionId, opt);
  //   session = new Session("", sessionId, options);

  //   // sessionObjects.sessions.add(session);
  // }

  console.info("--- initSession");

  window.call = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    //videoSource: false,
    //audioSource: false,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  window.call.on("track-started", (dailyEvent) => {
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
        hasAudio: true,
        hasVideo: true,
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
  });

  const session = new Session(partnerId, roomUrl, options);

  return session;
}

export function initPublisher(
  targetElement?: string, // | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OT.OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): Need checking to make sure that the target element is a valid element.

  if (!callback || !targetElement) {
    console.error("TODO call back logic");
    return {} as Publisher;
  }

  const publisher = new Publisher({
    ...properties,
    dailyElementId: targetElement,
  });

  const err = null;

  if (err && callback) {
    callback(err);
  }

  const elm = document.getElementById(targetElement);
  if (!elm) {
    console.error("No element found for targetElement");
    callback({ name: "error", message: "No element found for targetElement" });
    return {} as Publisher;
  }

  // publisher.once("initSuccess", removeInitSuccessAndCallComplete);
  // publisher.once("publishComplete", removeHandlersAndCallComplete);
  // publisher.publish(elm);
  return publisher;
}

// window.OT.initSession = initSession;
// window.OT.initPublisher = initPublisher;
