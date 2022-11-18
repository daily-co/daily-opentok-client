import { DailyParticipant } from "@daily-co/daily-js";
import {
  createOrUpdateMedia,
  Dimensions,
  getParticipantTracks,
} from "../shared/media";
import { InsertMode, Publisher } from "./Publisher";
import { errNotImplemented } from "../shared/errors";
import { toCSSDimensions } from "../shared/utils";
import { getVideoElementCreatedEvent } from "./OTEvents";

// updateMediaDOM() updates the DOM element(s) associated
// with the given participant's media tracks.
export function updateMediaDOM(
  participant: DailyParticipant,
  publisher: Publisher,
  rootElementID?: string
) {
  // Early out if the participant is not local
  const isLocal = participant.local;
  if (!isLocal) return;

  const tracks = getParticipantTracks(participant);
  // No audio needed for local participant/publisher
  tracks.audio = null;

  const dimensions = {
    width: "",
    height: "",
  } as Dimensions;
  const w = publisher.width;
  const h = publisher.height;
  if (w) dimensions.width = toCSSDimensions(w);
  if (h) dimensions.height = toCSSDimensions(h);

  const sessionID = participant.session_id;

  // Get root element on which to append the new video element
  let root: HTMLElement | null = null;
  if (rootElementID) {
    root = document.getElementById(rootElementID);
  }

  if (root === null) {
    root = document.createElement("div");

    document.body.appendChild(root);
  }

  const videoData = createOrUpdateMedia(sessionID, tracks, dimensions);
  // If this video was newly created, append it to DOM
  if (videoData.isNew) {
    publisher.ee.emit(
      "videoElementCreated",
      getVideoElementCreatedEvent(videoData.videoEl, publisher)
    );
    // Only attach if insertDefaultUI is false
    attachDOM(root, videoData.videoEl, publisher.insertMode);
  }
  return videoData.videoEl;
}

// attachDOM() attaches the given video element to the
// provided root.
function attachDOM(
  root: HTMLElement,
  videoEl: HTMLVideoElement,
  insertMode?: InsertMode
) {
  console.debug("Attaching publisher video element to DOM");
  // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
  switch (insertMode) {
    case "append":
      root.appendChild(videoEl);
      break;
    case "replace":
      errNotImplemented("'replace' insert mode");
      break;
    case "before":
      errNotImplemented("'before' insert mode");
      break;
    case "after":
      errNotImplemented("'after' insert mode");
      break;
    default:
      break;
  }
}
