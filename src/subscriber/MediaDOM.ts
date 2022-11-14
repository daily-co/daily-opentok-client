import { OTError, SubscriberProperties } from "@opentok/client";
import { getVideoTagID, Tracks } from "../utils";

export function removeParticipantMedia(sessionID: string): boolean {
  // Remove video tracks
  const v = document.getElementById(getVideoTagID(sessionID));
  if (v) {
    v.remove();
    return true;
  }
  return false;
}

export function addOrUpdateMedia(
  sessionID: string,
  mediaTracks: Tracks,
  root: HTMLElement,
  properties?: SubscriberProperties | ((error?: OTError) => void)
): HTMLVideoElement {
  // Retrieve the existing video DOM element for this participant
  const videoTagID = getVideoTagID(sessionID);
  const existingVideoElement = document.getElementById(videoTagID);

  // This will be the element we work with to retrieve/set tracks
  let videoEl: HTMLVideoElement;

  if (!existingVideoElement) {
    // If video DOM element does not already exist, create a new one
    videoEl = document.createElement("video");
    videoEl.id = videoTagID;

    if (properties && typeof properties !== "function") {
      videoEl.style.width = properties.width?.toString() ?? "";
      videoEl.style.height = properties.height?.toString() ?? "";
    }
    root.appendChild(videoEl);
  } else if (existingVideoElement instanceof HTMLVideoElement) {
    videoEl = existingVideoElement;
  } else {
    // If video element is on an unexpected type, error out
    throw new Error("Video element is invalid.");
  }

  const srcObject = videoEl.srcObject;
  const { video, audio } = mediaTracks;

  // If source object is not already set, or is
  // some unsupported type, create a new MediaStream
  // and set it.
  if (!srcObject || !(srcObject instanceof MediaStream)) {
    const tracks: MediaStreamTrack[] = [];
    if (video) tracks.push(video);
    if (audio) tracks.push(audio);

    const newStream = new MediaStream(tracks);
    videoEl.srcObject = newStream;
    videoEl.autoplay = true;

    return videoEl;
  }

  // If source object is an instance of MediaStream,
  // replace old tracks with new ones as needed
  if (srcObject instanceof MediaStream) {
    if (video) {
      updateVideoTrack(srcObject, video);
      videoEl.style.visibility = "visible";
    }
    if (audio) updateAudioTrack(srcObject, audio);
  } else {
    throw new Error("Video element's source object is invalid.");
  }
  return videoEl;
}

// updateAudioTrack() makes sure an existing stream is updated with
// the given audio track.
function updateAudioTrack(
  existingStream: MediaStream,
  newTrack: MediaStreamTrack
) {
  const existingTracks = existingStream.getAudioTracks();
  updateMediaTrack(existingStream, existingTracks, newTrack);
}

// updateVideoTrack() makes sure an existing stream is updated with
// the given video track.
function updateVideoTrack(
  existingStream: MediaStream,
  newTrack: MediaStreamTrack
) {
  const existingTracks = existingStream.getVideoTracks();
  updateMediaTrack(existingStream, existingTracks, newTrack);
}

// updateMediaTracks() compares existing media track IDs with new ones,
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
