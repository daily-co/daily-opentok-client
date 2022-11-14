// START DAILY EVENT HANDLERS
import {
  DailyEventObjectFatalError,
  DailyEventObjectNonFatalError,
  DailyEventObjectParticipantLeft,
  DailyParticipant,
} from "@daily-co/daily-js";
import { ExceptionEvent, Stream } from "@opentok/client";
import { EventEmitter } from "stream";
import {
  getConnectionCreatedEvent,
  getConnectionDestroyedEvent,
  getSessionDisconnectedEvent,
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

  onFatalError(dailyEvent: DailyEventObjectFatalError | undefined) {
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

  onParticipantJoined(participant: DailyParticipant) {
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

    this.ee.emit("streamCreated", getStreamCreatedEvent(this.session, stream));
    this.ee.emit(
      "connectionCreated",
      getConnectionCreatedEvent(this.session, connection)
    );
  }

  onParticipantLeft(dailyEvent: DailyEventObjectParticipantLeft) {
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
      getConnectionDestroyedEvent(this.session, connection)
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

    this.ee.emit(
      "streamDestroyed",
      getStreamDestroyedEvent(this.session, stream)
    );
  }

  onNetworkConnection(event: string) {
    const otEvent = getSessionDisconnectedEvent(this.session);

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
