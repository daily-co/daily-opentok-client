// START DAILY EVENT HANDLERS

import { DailyParticipant } from "@daily-co/daily-js";
import { OTError, SubscriberProperties } from "@opentok/client";
import { EventEmitter } from "stream";
import { addOrUpdateMedia } from "./MediaDOM";
import { getParticipantTracks, removeParticipantMedia } from "../shared/media";

// DailyEventHandler is a class that handles Daily events and
// emits relevant OT events via the provided emitter
export class DailyEventHandler {
  private ee: EventEmitter;
  constructor(ee: EventEmitter) {
    this.ee = ee;
  }

  // onTrackStarted() handles Daily's "track-started" event
  onTrackStarted(
    participant: DailyParticipant,
    root: HTMLElement,
    properties?: SubscriberProperties | ((error?: OTError) => void),
    completionHandler: ((error?: OTError) => void) | undefined = undefined
  ) {
    const { session_id, local } = participant;

    // Local participant updates are handled by the Publisher
    if (local) return;

    // Get audio and video tracks from the participant
    const tracks = getParticipantTracks(participant);

    try {
      const videoEl = addOrUpdateMedia(session_id, tracks, root, properties);
      videoEl.onerror = (e) => {
        console.error("Video error", e);
        if (!completionHandler) return;
        if (typeof e === "string") {
          completionHandler(new Error(e));
        } else if (e instanceof Error) {
          completionHandler(e);
        }
      };
    } catch (e) {
      if (!completionHandler) return;
      if (typeof e === "string") {
        completionHandler(new Error(e));
      } else if (e instanceof Error) {
        completionHandler(e);
      }
    }
  }

  // onParticipantLeft() handles Daily's "participant-left" event
  onParticipantLeft(sessionID: string) {
    if (removeParticipantMedia(sessionID)) {
      this.ee.emit("destroyed");
    }
  }
}
