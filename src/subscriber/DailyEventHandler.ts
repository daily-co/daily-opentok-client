// START DAILY EVENT HANDLERS

import { DailyParticipant } from "@daily-co/daily-js";
import { OTError, SubscriberProperties } from "@opentok/client";
import { EventEmitter } from "stream";
import { addOrUpdateMedia, removeParticipantMedia } from "./MediaDOM";
import { getParticipantTracks } from "../utils";

export class DailyEventHandler {
  private ee: EventEmitter;
  constructor(ee: EventEmitter) {
    this.ee = ee;
  }

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

  onParticipantLeft(sessionID: string) {
    if (removeParticipantMedia(sessionID)) {
      this.ee.emit("destroyed");
    }
  }

  onLeftMeeting() {
    const videos = document.getElementsByTagName("video");

    for (const video of videos) {
      if (video.id.includes("daily-video-")) {
        video.srcObject = null;
        video.remove();
        this.ee.emit("destroyed");
      }
    }
  }
}
