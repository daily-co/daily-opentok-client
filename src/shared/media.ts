// This file handles all shared operations related to participant
// media and media DOM.
import { DailyParticipant } from "@daily-co/daily-js";

export const participantMediaClassName = "participant-media";

export interface Tracks {
  audio?: MediaStreamTrack | null;
  video?: MediaStreamTrack | null;
  screen?: MediaStreamTrack | null;
}

export interface Dimensions {
  width: string;
  height: string;
}

export function getVideoTagID(sessionID: string) {
  return `daily-video-${sessionID}`;
}

export const getParticipantTracks = ({ tracks }: DailyParticipant): Tracks => {
  const { audio: at, screenVideo: st, video: vt } = tracks;

  const validStates = ["playable", "interrupted", "loading"];
  const video = validStates.includes(vt.state) ? vt.persistentTrack : null;
  const audio = validStates.includes(at.state) ? at.persistentTrack : null;
  const screen = validStates.includes(st.state) ? st.persistentTrack : null;

  return {
    video: video,
    audio: audio,
    screen: screen,
  };
};

export function removeParticipantMedia(sessionID: string): boolean {
  // Remove video tags
  const v = document.getElementById(getVideoTagID(sessionID));
  if (v) {
    v.remove();
    return true;
  }
  return false;
}

export function removeAllParticipantMedias() {
  const allParticipantDOMs = document.getElementsByClassName(
    participantMediaClassName
  );
  // An HTMLCollection is live and updated when underlying
  // elements change; since we are removing every underlying 
  // element, the collection will keep dynamically shrinking 
  // with each iteration until there are no elements left.
  while (allParticipantDOMs.length > 0) {
    const el = allParticipantDOMs[0]
    const vid = el as HTMLVideoElement;
    vid.srcObject = null;
    vid.remove();
  }
}

export function createOrUpdateMedia(
  sessionID: string,
  mediaTracks: Tracks,
  dimensions?: Dimensions
): { videoEl: HTMLVideoElement; isNew: boolean } {
  // Retrieve the existing video DOM element for this participant
  let videoEl = getVideoElement(sessionID);
  console.debug("video element:", videoEl);
  if (!videoEl) {
    // If video DOM element does not already exist, create a new one
    // with the given tracks.
    let height = "";
    let width = "";
    if (dimensions) {
      width = dimensions.width;
      height = dimensions.height;
    }

    videoEl = createVideoElement(sessionID, width, height, mediaTracks);
    return {
      videoEl: videoEl,
      isNew: true,
    };
  }

  // If we had an existing element already, see
  // if tracks need to be replaced
  const srcObject = videoEl.srcObject;
  const { video, audio } = mediaTracks;

  if (!srcObject || !(srcObject instanceof MediaStream)) {
    throw new Error(
      "MediaStream source object not found or is of unexpected type"
    );
  }

  // If we get here, the video element has a source object
  // and that source object is of expected type.
  if (video) {
    updateVideoTrack(srcObject, video);
    videoEl.style.visibility = "visible";
  }
  if (audio) updateAudioTrack(srcObject, audio);

  return {
    videoEl: videoEl,
    isNew: false,
  };
}

// createVideoElement() creates a new video element with the given dimensions
export function createVideoElement(
  sessionID: string,
  width = "",
  height = "",
  tracks?: Tracks
): HTMLVideoElement {
  const videoEl = document.createElement("video");
  videoEl.autoplay = true;
  videoEl.playsInline = true;
  videoEl.id = getVideoTagID(sessionID);
  videoEl.classList.add(participantMediaClassName);
  videoEl.style.width = width;
  videoEl.style.height = height;
  if (tracks) {
    const tracksArr: MediaStreamTrack[] = [];
    const vt = tracks.video;
    const at = tracks.audio;
    if (vt) tracksArr.push(vt);
    if (at) tracksArr.push(at);

    const newStream = new MediaStream(tracksArr);
    videoEl.srcObject = newStream;
  } else {
    videoEl.srcObject = new MediaStream();
  }

  return videoEl;
}

// getExistingVideoElements() returns the existing video element, if any,
// for the given participant session ID.
export function getVideoElement(sessionID: string): HTMLVideoElement | null {
  const existingVideoEl = document.getElementById(getVideoTagID(sessionID));
  console.debug(
    "existing video el:",
    getVideoTagID(sessionID),
    existingVideoEl
  );
  if (existingVideoEl && !(existingVideoEl instanceof HTMLVideoElement)) {
    throw new Error("Video element ID is invalid.");
  }
  return existingVideoEl;
}

// updateAudioTrack() makes sure an existing stream is updated with
// the given audio track.
export function updateAudioTrack(
  existingStream: MediaStream,
  newTrack: MediaStreamTrack
) {
  const existingTracks = existingStream.getAudioTracks();
  updateMediaTrack(existingStream, existingTracks, newTrack);
}

// updateVideoTrack() makes sure an existing stream is updated with
// the given video track.
export function updateVideoTrack(
  existingStream: MediaStream,
  newTrack: MediaStreamTrack
) {
  const existingTracks = existingStream.getVideoTracks();
  updateMediaTrack(existingStream, existingTracks, newTrack);
}

// updateMediaTrack() compares existing media track IDs with new ones,
// and replaces them if needed.
function updateMediaTrack(
  existingStream: MediaStream,
  oldTracks: MediaStreamTrack[],
  newTrack: MediaStreamTrack
) {
  const trackCount = oldTracks.length;
  // If there are no old tracks,
  // add the new track.
  if (trackCount === 0) {
    existingStream.addTrack(newTrack);
    return;
  }

  if (trackCount > 1) {
    console.warn(
      `expected 1 track, but got ${trackCount}. Only using the first one.`
    );
  }
  const oldTrack = oldTracks[0];
  // If the IDs of the old and new track don't match,
  // replace the old track with the new one.
  if (oldTrack.id !== newTrack.id) {
    existingStream.removeTrack(oldTrack);
    existingStream.addTrack(newTrack);
  }
}
