import { DailyParticipant } from "@daily-co/daily-js";
import { Stream } from "@opentok/client";
import {
  createOrUpdateMedia,
  Dimensions,
  getParticipantTracks,
} from "../shared/media";
import { InsertMode, Publisher } from "./Publisher";
import { errNotImplemented } from "../shared/errors";
import { toCSSDimensions } from "../shared/utils";

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
  setPublisherStream(participant, publisher);

  const dimensions = {
    width: "",
    height: "",
  } as Dimensions;
  const w = publisher.width;
  const h = publisher.height;
  if (w) dimensions.width = toCSSDimensions(w);
  if (h) dimensions.height = toCSSDimensions(h);

  const sessionID = participant.session_id;

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
    attachDOM(root, videoData.video, publisher.insertMode);
  }
  return videoData.video;
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

// TODO: [LIZA] what is this stream later used for?
// I see it being set but seemingly not consumed
function setPublisherStream(
  participant: DailyParticipant,
  publisher: Publisher
) {
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
    videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
    creationTime,
    connection: {
      connectionId: user_id, // TODO
      creationTime,
      // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
      // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
      data: "",
    },
  };
  publisher.stream = stream;
}
