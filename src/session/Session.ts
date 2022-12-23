import {
  Connection,
  OTError,
  Event,
  Stream,
  SubscriberProperties,
  PublisherProperties,
} from "@opentok/client";
import { OTEventEmitter } from "../OTEventEmitter";
import { Publisher } from "../publisher/Publisher";
import { Subscriber } from "../subscriber/Subscriber";
import OT from "../index";
import { DailyEventHandler } from "../session/DailyEventHandler";
import { errNotImplemented } from "../shared/errors";
import { getOrCreateCallObject } from "../shared/utils";
import { getConnectionCreatedEvent } from "./OTEvents";
import { DailyEventObjectParticipant } from "@daily-co/daily-js";
import jwt_decode from "jwt-decode";

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
  eventHandler: DailyEventHandler;

  constructor(_apiKey: string, sessionId: string, _opt: unknown) {
    super();
    this.sessionId = sessionId;
    this.id = this.sessionId;

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
    this.eventHandler = new DailyEventHandler(this);
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
        ? OT.initPublisher(publisher, properties)
        : publisher;

    localPublisher.session = this;

    const call = getOrCreateCallObject();

    const onParticipantUpdated = (dailyEvent?: DailyEventObjectParticipant) => {
      // run once for local participant only
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }

      const { participant } = dailyEvent;

      if (!participant.local) {
        console.debug("Not local participant");
        return;
      }
      call.off("participant-updated", onParticipantUpdated);
      completionHandler?.();

      this.eventHandler.onLocalParticipantUpdated(participant);
    };

    call
      .on("participant-joined", (dailyEvent) => {
        // remote
        if (!dailyEvent) {
          console.debug("No Daily event");
          return;
        }
        this.eventHandler.onParticipantJoined(dailyEvent.participant);
      })
      .on("participant-updated", onParticipantUpdated)
      .updateParticipant("local", {
        setAudio: true,
        setVideo: true,
      });

    return localPublisher;
  }
  connect(token: string, callback: (error?: OTError) => void): void {
    const call = getOrCreateCallObject();
    const connectionData = getConnectionData(token);
    const eh = this.eventHandler;
    call
      .on("error", (dailyEvent) => {
        eh.onFatalError(dailyEvent);
      })
      .on("nonfatal-error", (dailyEvent) => {
        eh.onNonFatalError(dailyEvent);
      })
      .on("network-connection", (dailyEvent) => {
        console.debug("network-connection", dailyEvent);
        if (!dailyEvent) {
          return;
        }
        eh.onNetworkConnection(dailyEvent.event);
      })
      .on("network-quality-change", (dailyEvent) => {
        if (!dailyEvent) {
          return;
        }
        // TODO(jamsea): emit opentok event
      })
      .on("joined-meeting", (dailyEvent) => {
        // Local
        if (!dailyEvent?.participants.local) return;

        const { joined_at = new Date(), user_id } =
          dailyEvent.participants.local;
        const creationTime = joined_at.getTime();

        const connection = {
          connectionId: user_id,
          creationTime,
          data: connectionData,
        };

        callback();
        const sessionConnectedEvent: Event<"sessionConnected", Session> = {
          type: "sessionConnected",
          target: this,
          cancelable: true,
          isDefaultPrevented: () => true,
          preventDefault: () => true,
        };
        this.ee.emit(
          "connectionCreated",
          getConnectionCreatedEvent(this, connection)
        );
        this.ee.emit("sessionConnected", sessionConnectedEvent);
      })
      .on("participant-joined", (dailyEvent) => {
        // Remote
        if (!dailyEvent) return;
        eh.onParticipantJoined(dailyEvent.participant, connectionData);
      })
      .on("participant-left", (dailyEvent) => {
        if (!dailyEvent) return;
        eh.onParticipantLeft(dailyEvent);
      })
      .join({
        url: this.sessionId,
        token,
        startVideoOff: call.localVideo(),
        startAudioOff: call.localAudio(),
      })
      .catch((e) => {
        if (typeof e === "string") {
          callback(new Error(e));
        } else if (e instanceof Error) {
          callback(e);
        }
      });
  }

  // subscribe() subscribes creates a new Subscriber
  // and renders their video/audio.
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

    // If target element does not exist, error out
    if (!targetElement) {
      const err = new Error("No target element");
      completionHandler(err);
      throw err;
    }

    const root =
      targetElement instanceof HTMLElement
        ? targetElement
        : document.getElementById(targetElement);

    if (!root) {
      const err = new Error("No target element");
      completionHandler(err);
      throw err;
    }

    const subscriber = new Subscriber(
      root,
      {
        stream,
        id:
          typeof targetElement === "string" ? targetElement : targetElement.id,
      },
      completionHandler,
      properties
    );

    // Subscribe to the user's tracks
    const { streamId } = stream;
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
    errNotImplemented(this.forceDisconnect.name);
  }

  forceUnpublish(_stream: Stream, _callback: (error?: OTError) => void): void {
    errNotImplemented(this.forceUnpublish.name);
  }

  forceMuteStream(_stream: Stream): Promise<void> {
    return new Promise((_, reject) => {
      reject(errNotImplemented(this.forceMuteStream.name));
    });
  }

  forceMuteAll(_excludedStreams?: Stream[]): Promise<void> {
    return new Promise((_, reject) => {
      reject(errNotImplemented(this.forceMuteAll.name));
    });
  }

  getPublisherForStream(_stream: Stream): Publisher | undefined {
    errNotImplemented(this.getPublisherForStream.name);
  }

  getSubscribersForStream(_stream: Stream): [Subscriber] {
    errNotImplemented(this.getSubscribersForStream.name);
  }

  setEncryptionSecret(_secret: string): Promise<void> {
    return new Promise((_, reject) => {
      reject(errNotImplemented(this.setEncryptionSecret.name));
    });
  }
  signal(
    _signal: { type?: string; data?: string; to?: OT.Connection },
    _callback: (error?: OTError) => void
  ): void {
    errNotImplemented("signal");
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

function getConnectionData(token: string): string {
  if (!token) return "";

  interface Payload {
    otcd?: string;
  }

  let payload: Payload;
  try {
    payload = jwt_decode(token);
  } catch (_) {
    return "";
  }
  const otcd = payload.otcd;
  return otcd ?? "";
}
