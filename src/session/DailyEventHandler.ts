// START DAILY EVENT HANDLERS
import {
  DailyEventObjectFatalError,
  DailyEventObjectNonFatalError,
  DailyEventObjectParticipantLeft,
  DailyParticipant,
} from "@daily-co/daily-js";
import { ExceptionEvent, Stream } from "@opentok/client";
import { EventEmitter } from "stream";
import { removeAllParticipantMedias } from "../shared/media";
import { createStream } from "../shared/ot";
import {
  getConnectionCreatedEvent,
  getConnectionDestroyedEvent,
  getSessionDisconnectedEvent,
  getSignalEvent,
  getStreamCreatedEvent,
  getStreamDestroyedEvent,
} from "./OTEvents";
import { Session } from "./Session";

// DailyEventHandler handles all Daily events related to the session
export class DailyEventHandler {
  private ee: EventEmitter;
  private session: Session;
  private reconnecting = false;

  constructor(session: Session) {
    this.session = session;
    this.ee = session.ee;
  }
  // onAppMessage() handles Daily's "app-message" event
  onAppMessage(dailyEvent: {
    fromId: string;
    data: { type?: string; data?: string };
  }) {
    const d = dailyEvent.data;

    const connection: OT.Connection = {
      connectionId: dailyEvent.fromId,
      creationTime: new Date().getTime(),
      data: "",
    };

    const signalEvent = getSignalEvent(
      this.session,
      d.type,
      d.data,
      connection
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (signalEvent.type) {
      this.ee.emit(`signal:${signalEvent.type}`, signalEvent);
    }
    this.ee.emit("signal", signalEvent);
  }

  // onFatalError() handles Daily's "error" event
  onFatalError(dailyEvent: DailyEventObjectFatalError | undefined) {
    console.error("fatal error", dailyEvent);

    const error: unknown = dailyEvent?.error;

    if (!(error && typeof error === "object")) {
      return;
    }

    let msg = "";
    let type = "";
    if ("localizedMsg" in error && typeof error.localizedMsg === "string") {
      msg = error.localizedMsg;
    }
    if ("type" in error && typeof error.type === "string") {
      type = error.type;
    }
    this.emitExceptionEvent(msg, type);
  }

  // onNonFatalError() handles Daily's "nonfatal-error" event
  onNonFatalError(error: DailyEventObjectNonFatalError | undefined) {
    console.error("nonfatal error", error);
    let msg = "";
    let type = "";
    if (error) {
      msg = error.errorMsg;
      type = error.type;
    }
    this.emitExceptionEvent(msg, type);
  }

  // onParticipantJoined() handles Daily's "participant-joined" event
  onParticipantJoined(participant: DailyParticipant, connectionData = "") {
    const { joined_at = new Date(), session_id } = participant;
    const creationTime = joined_at.getTime();

    const connection = {
      connectionId: session_id,
      creationTime,
      data: connectionData,
    };

    const stream = createStream(participant);

    // session connected

    this.ee.emit("streamCreated", getStreamCreatedEvent(this.session, stream));
    this.ee.emit(
      "connectionCreated",
      getConnectionCreatedEvent(this.session, connection)
    );
  }

  // onLocalParticipantUpdated() handles Daily's "participant-updated" event for
  // local participant
  onLocalParticipantUpdated(participant: DailyParticipant) {
    const stream = createStream(participant);
    this.ee.emit("streamCreated", getStreamCreatedEvent(this.session, stream));
  }

  // onParticipantLeft() handles Daily's "participant-left" event
  onParticipantLeft(dailyEvent: DailyEventObjectParticipantLeft) {
    const { participant } = dailyEvent;
    const {
      session_id,
      audio: hasAudio,
      video: hasVideo,
      tracks,
      joined_at = new Date(),
    } = participant;
    const creationTime = joined_at.getTime();

    const settings = tracks.video.track?.getSettings() ?? {};
    const { frameRate = 0, height = 0, width = 0 } = settings;

    const connection = {
      connectionId: session_id,
      creationTime,
      data: "",
    };

    this.ee.emit(
      "connectionDestroyed",
      getConnectionDestroyedEvent(this.session, connection)
    );

    const stream: Stream = {
      streamId: session_id,
      frameRate,
      hasAudio,
      hasVideo,
      // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
      name: "",
      initials: "",
      videoDimensions: {
        height,
        width,
      },
      videoType: "camera",
      creationTime: joined_at.getTime(),
      connection,
    };

    this.ee.emit(
      "streamDestroyed",
      getStreamDestroyedEvent(this.session, stream)
    );
  }

  // onLeftMeeting() handles Daily's "left-meeting" event
  onLeftMeeting(target: Session) {
    this.ee.emit(
      "sessionDisconnected",
      getSessionDisconnectedEvent(target, "clientDisconnected")
    );
    removeAllParticipantMedias();
  }

  // onNetworkConnection() handles Daily's "network-connection" event
  onNetworkConnection(event: string) {
    const otEvent = getSessionDisconnectedEvent(
      this.session,
      "networkDisconnected"
    );

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

  // emitExceptionEvent() emits an exception OT event
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
}
