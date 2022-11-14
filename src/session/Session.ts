import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
  PublisherProperties,
  ExceptionEvent,
} from "@opentok/client";
import Daily, {
  DailyEventObjectFatalError,
  DailyEventObjectNonFatalError,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyParticipant,
} from "@daily-co/daily-js";
import { OTEventEmitter } from "../OTEventEmitter";
import { Publisher } from "../publisher/Publisher";
import { Subscriber } from "../subscriber/Subscriber";
import { getParticipantTracks, notImplemented } from "../utils";
import OT from "../index";
import {
  getConnectionCreatedEvent,
  getConnectionDestroyedEvent,
  getSessionDisconnectedEvent,
  getStreamCreatedEvent,
  getStreamDestroyedEvent,
} from "./SessionEvents";
import {
  addOrUpdateMedia,
  getVideoTagID,
  removeParticipantMedia,
} from "./MediaDOM";

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

  constructor(_apiKey: string, sessionId: string, _opt: unknown) {
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

    // If the publisher is a string or HTMLElement, we need to create a new
    // Publisher object.
    const localPublisher: Publisher =
      typeof publisher === "string" || publisher instanceof HTMLElement
        ? OT.initPublisher(publisher, properties, completionHandler)
        : publisher;

    if (!window.call) {
      console.error("No daily call object");
      completionHandler({
        message: "No call",
        name: "NoCall",
      });
      return localPublisher;
    }

    window.call.on("participant-joined", (dailyEvent) => {
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }
      this.onParticipantJoined(dailyEvent?.participant, localPublisher);
    });

    window.call.updateParticipant("local", {
      setAudio: true,
      setVideo: true,
    });

    completionHandler();

    return localPublisher;
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
      .on("error", (dailyEvent) => {
        this.onFatalError(dailyEvent);
      })
      .on("nonfatal-error", (dailyEvent) => {
        this.onNonFatalError(dailyEvent);
      })
      .on("network-connection", (dailyEvent) => {
        console.debug("network-connection", dailyEvent);
        if (!dailyEvent) {
          return;
        }
        this.onNetworkConnection(dailyEvent.event);
      })
      .on("network-quality-change", (dailyEvent) => {
        if (!dailyEvent) {
          return;
        }
        // TODO(jamsea): emit opentok event
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
    const call = window.call;

    if (!call) {
      throw new Error("No daily call object");
    }

    let completionHandler: ((error?: OTError) => void) | undefined;
    ({ completionHandler, targetElement, properties } = setupCompletionHandler(
      targetElement,
      properties,
      callback
    ));

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

    const subscriber = new Subscriber(root, {
      stream,
      id: typeof targetElement === "string" ? targetElement : targetElement.id,
    });

    // Set up Daily call object event listeners.
    call
      .on("track-started", (dailyEvent) => {
        // Make sure the track has started before publishing the session
        // TODO(jamsea): need to figure out the error handling here.

        if (!dailyEvent?.participant) {
          console.debug("track-started no participant");
          return;
        }

        this.onTrackStarted(
          dailyEvent.participant,
          root,
          properties,
          completionHandler
        );
      })
      .on("participant-left", (dailyEvent) => {
        if (!dailyEvent) return;

        this.onParticipantLeft(dailyEvent, subscriber);
      })
      .on("left-meeting", (dailyEvent) => {
        if (!dailyEvent) {
          return;
        }

        this.onLeftMeeting(subscriber);
      })
      .on("track-stopped", (dailyEvent) => {
        if (!dailyEvent?.participant) return;

        const {
          participant: { session_id },
        } = dailyEvent;

        if (removeParticipantMedia(session_id)) {
          subscriber.ee.emit("destroyed");
        }
      });

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (call.participants().local?.session_id !== streamId) {
      call.updateParticipant(streamId, {
        setSubscribedTracks: {
          audio: true,
          video: true,
          screenVideo: false,
          screenAudio: false,
        },
      });
    }

    completionHandler();

    return subscriber;
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
    window.call
      .leave()
      .then(() => {
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
      })
      .catch((err) => {
        console.error(err);
      });
  }

  forceDisconnect(
    _connection: OT.Connection,
    _callback: (error?: OTError) => void
  ): void {
    notImplemented(this.forceDisconnect.name);
  }

  forceUnpublish(_stream: Stream, _callback: (error?: OTError) => void): void {
    notImplemented(this.forceUnpublish.name);
  }

  forceMuteStream(_stream: Stream): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented(this.forceMuteStream.name));
    });
  }

  forceMuteAll(_excludedStreams?: Stream[]): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented(this.forceMuteAll.name));
    });
  }

  getPublisherForStream(_stream: Stream): Publisher | undefined {
    notImplemented(this.getPublisherForStream.name);
  }

  getSubscribersForStream(_stream: Stream): [Subscriber] {
    notImplemented(this.getSubscribersForStream.name);
  }

  setEncryptionSecret(_secret: string): Promise<void> {
    return new Promise((_, reject) => {
      reject(notImplemented(this.setEncryptionSecret.name));
    });
  }
  signal(
    _signal: { type?: string; data?: string; to?: OT.Connection },
    _callback: (error?: OTError) => void
  ): void {
    notImplemented("signal");
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const { session_id } = window.call.participants().local ?? {
      session_id: "",
    };

    if (streamId && session_id !== streamId) {
      window.call.updateParticipant(streamId, {
        setSubscribedTracks: {
          audio: false,
          video: false,
          screenVideo: false,
          screenAudio: false,
        },
      });
    }

    subscriber.ee.emit("destroyed"); // This isn't quite right, it should be emitted when the dom element is removed.
  }

  // START DAILY EVENT HANDLERS

  private onFatalError(dailyEvent: DailyEventObjectFatalError | undefined) {
    console.error("fatal error", dailyEvent);
    const error = dailyEvent?.error;
    let msg = "";
    let type = "";
    if (error) {
      msg = error.localizedMsg ?? "";
      type = error.type;
    }
    this.emitExceptionEvent(msg, type);
  }

  private onNonFatalError(error: DailyEventObjectNonFatalError | undefined) {
    console.error("nonfatal error", error);
    let msg = "";
    let type = "";
    if (error) {
      msg = error.errorMsg ?? "";
      type = error.type;
    }
    this.emitExceptionEvent(msg, type);
  }

  private emitExceptionEvent(msg: string, type: string) {
    const exceptionEvent: ExceptionEvent = {
      // TODO: Map out the error codes (https://tokbox.com/developer/sdks/js/reference/ExceptionEvent.html)
      code: 2000,
      message: msg,
      title: type,
      preventDefault: () => true,
      isDefaultPrevented: () => true,
      type: "exception",
      cancelable: false,
      target: this,
    };

    this.ee.emit("exception", exceptionEvent);
  }

  private onParticipantJoined(
    participant: DailyParticipant,
    localPublisher: Publisher
  ) {
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

    localPublisher.stream = stream;
    this.connection = connection;
    this.ee.emit("streamCreated", getStreamCreatedEvent(this, stream));
    this.ee.emit(
      "connectionCreated",
      getConnectionCreatedEvent(this, connection)
    );
  }

  onTrackStarted(
    participant: DailyParticipant,
    root: HTMLElement,
    properties?: SubscriberProperties | ((error?: OTError) => void),
    completionHandler: ((error?: OTError) => void) | undefined = undefined
  ) {
    // Get audio and video tracks from the participant
    const tracks = getParticipantTracks(participant);

    const { session_id, local } = participant;
    try {
      const videoEl = addOrUpdateMedia(
        session_id,
        local,
        tracks,
        root,
        properties
      );
      if (videoEl) {
        videoEl.onerror = (e) => {
          console.error("Video error", e);
          if (!completionHandler) return;
          if (typeof e === "string") {
            completionHandler(new Error(e));
          } else if (e instanceof Error) {
            completionHandler(e);
          }
        };
      }
      
    } catch (e) {
      if (!completionHandler) return;
      if (typeof e === "string") {
        completionHandler(new Error(e));
      } else if (e instanceof Error) {
        completionHandler(e);
      }
    }
  }

  private onParticipantLeft(
    dailyEvent: DailyEventObjectParticipantLeft,
    subscriber: Subscriber
  ) {
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

    this.ee.emit(
      "connectionDestroyed",
      getConnectionDestroyedEvent(this, connection)
    );

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
      videoType: "camera",
      creationTime: joined_at.getTime(),
      connection,
    };

    this.ee.emit("streamDestroyed", getStreamDestroyedEvent(this, stream));

    const v = document.getElementById(getVideoTagID(session_id));
    if (v) {
      v.remove();
      subscriber.ee.emit("destroyed");
    }
  }

  private onNetworkConnection(event: string) {
    const otEvent = getSessionDisconnectedEvent(this);

    switch (event) {
      case "interrupted":
        this.ee.emit("sessionReconnecting", otEvent);
        this.reconnecting = true;
        break;
      case "connected":
        if (this.reconnecting) {
          this.ee.emit("sessionReconnected", otEvent);
          this.reconnecting = false;
        }
        break;
      default:
        break;
    }
  }

  private onLeftMeeting(subscriber: Subscriber) {
    const videos = document.getElementsByTagName("video");

    for (const video of videos) {
      if (video.id.includes("daily-video-")) {
        video.srcObject = null;
        video.remove();
        subscriber.ee.emit("destroyed");
      }
    }
  }

  // END DAILY EVENT HANDLERS
}
function setupCompletionHandler(
  targetElement: string | HTMLElement | undefined,
  properties:
    | SubscriberProperties
    | ((error?: OTError | undefined) => void)
    | undefined,
  callback: ((error?: OTError | undefined) => void) | undefined
) {
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

  if (typeof callback === "function") {
    completionHandler = callback;
  }

  if (!completionHandler) {
    completionHandler = () => {
      // intentionally empty
    };
  }
  return { completionHandler, targetElement, properties };
}
