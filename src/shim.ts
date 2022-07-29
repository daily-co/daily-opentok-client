// import * as OT from "@opentok/client";
import {
  OTError,
  Event,
  Subscriber,
  Stream,
  SubscriberProperties,
} from "@opentok/client";
import Daily, { DailyCall } from "@daily-co/daily-js";

const sessionObjects = {
  // Publishers are id'd by their guid
  publishers: new Map(),
  // Subscribers are id'd by their widgetId
  subscribers: new Map(),
  sessions: new Map<string, Session>(),
};

let call: DailyCall | null = null;

class Publisher {
  constructor(properties) {
    console.log("publisher constructor", properties);
  }
  publish(
    publisher: Publisher,
    callback?: (error?: OTError) => void
  ): Publisher {
    console.log("publish");
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
  constructor(apiKey, sessionId, opt) {
    console.log("session constructor", apiKey, sessionId, opt);
  }
  on(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void {
    //todo
    console.log("on");
  }
  publish(
    publisher: Publisher,
    callback?: (error?: OTError) => void
  ): Publisher {
    console.log("publish");
    if (!call) return {} as Publisher;

    return {} as Publisher;
  }
  connect(token: string, callback: (error?: OT.OTError) => void): void {
    if (!call) {
      console.error("No call");
      callback({
        message: "No call (todo find message)",
        name: "NoCall (todo find name)",
      });
      return;
    }

    call
      .join({
        url: "https://hush.daily.co/meet",
      })
      .catch((err) => {
        console.error(err);
        callback({
          message: err,
          name: "DailyError",
        });
      });

    function startTrack(evt) {
      console.log("Track started: ", evt);
      if (evt.track.kind === "audio" && evt.participant.local === false) {
        let audiosDiv = document.getElementById("audios") as HTMLElement;
        let audioEl = document.createElement("audio");
        audiosDiv.appendChild(audioEl);
        audioEl.style.width = "100%";
        audioEl.srcObject = new MediaStream([evt.track]);
        audioEl.play();
      } else if (evt.track.kind === "video") {
        let videosDiv = document.getElementById("videos") as HTMLElement;
        let videoEl = document.createElement("video");
        videosDiv.appendChild(videoEl);
        videoEl.style.width = "100%";
        videoEl.srcObject = new MediaStream([evt.track]);
        console.log("-- videoEl", videoEl);
        videoEl.play();
      }
    }

    call.on("track-started", startTrack);
  }
  subscribe(
    stream: Stream,
    targetElement?: HTMLElement | string,
    properties?: SubscriberProperties,
    callback?: (error?: OTError) => void
  ): Subscriber {
    console.log("subscribe");
    return {} as Subscriber;
  }
}

export function initSession(
  partnerId: string,
  sessionId: string,
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

  const session = new Session("", sessionId, options);

  call = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    //videoSource: false,
    //audioSource: false,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  return session;
}

export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OT.OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): Need checking to make sure that the target element is a valid element.

  const publisher = new Publisher(properties || {});

  const err = null;

  if (err && callback) {
    callback(err);
  }

  // publisher.once("initSuccess", removeInitSuccessAndCallComplete);
  // publisher.once("publishComplete", removeHandlersAndCallComplete);
  // publisher.publish(targetElement);
  return publisher;
}

// window.OT.initSession = initSession;
// window.OT.initPublisher = initPublisher;
