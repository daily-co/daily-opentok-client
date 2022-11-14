import { DailyParticipant } from "@daily-co/daily-js";
import { Stream } from "@opentok/client";
import { getParticipantTracks, getVideoTagID, notImplemented } from "../utils";
import { InsertMode, Publisher } from "./Publisher";

export function updateMediaDOM(
  participant: DailyParticipant,
  publisher: Publisher,
  rootElementID?: string
) {
  const {
    session_id,
    audio: hasAudio,
    video: hasVideo,
    tracks,
    joined_at = new Date(),
    user_id,
    local,
  } = participant;
  const creationTime = joined_at.getTime();

  const settings = tracks.video.track?.getSettings() ?? {};
  const { frameRate = 0, height = 0, width = 0 } = settings;
  const { video } = getParticipantTracks(participant);

  if (!local || !video) {
    return;
  }

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

  let root: HTMLElement | null = null;
  if (rootElementID) {
    root = document.getElementById(rootElementID);
  }

  if (root === null) {
    root = document.createElement("div");
    document.body.appendChild(root);
  }

  const documentVideoElm = document.getElementById(getVideoTagID(session_id));

  if (
    !(documentVideoElm instanceof HTMLVideoElement) &&
    documentVideoElm != undefined
  ) {
    throw new Error("Video element id is invalid.");
  }

  const videoEl = documentVideoElm
    ? documentVideoElm
    : document.createElement("video");

  if (videoEl.srcObject && "getTracks" in videoEl.srcObject) {
    const tracks = videoEl.srcObject.getTracks();
    if (tracks[0].id === video.id) {
      return;
    }
  }

  attachDOM(root, videoEl, publisher.insertMode);

  videoEl.style.width = publisher.width ?? "";
  videoEl.style.height = publisher.height ?? "";
  videoEl.srcObject = new MediaStream([video]);

  videoEl.id = getVideoTagID(session_id);
  videoEl.play().catch((e) => {
    console.error(e);
  });
}

function attachDOM(
  root: HTMLElement,
  videoEl: HTMLVideoElement,
  insertMode?: InsertMode
) {
  // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
  switch (insertMode) {
    case "append":
      root.appendChild(videoEl);
      break;
    case "replace":
      notImplemented("'replace' insert mode");
      break;
    case "before":
      notImplemented("'before' insert mode");
      break;
    case "after":
      notImplemented("'after' insert mode");
      break;
    default:
      break;
  }
}
