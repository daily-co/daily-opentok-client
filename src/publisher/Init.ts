import { OTError } from "@opentok/client";
import { Publisher } from "./Publisher";
import { dailyUndefinedError, getOrCreateCallObject } from "../utils";
import { updateMediaDOM } from "./MediaDOM";

export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OTError | undefined) => void) | undefined
): Publisher {
  const rootElementID =
    targetElement instanceof HTMLElement ? targetElement.id : targetElement;

  const publisher = new Publisher(
    {
      width: properties?.width ?? "",
      height: properties?.height ?? "",
      insertMode: properties?.insertMode,
      showControls: properties?.showControls ?? false,
    },
    rootElementID
  );

  const completionHandler =
    typeof callback === "function"
      ? callback
      : () => {
          // empty
        };

  if (!targetElement) {
    completionHandler(new Error("No target element provided"));
    return publisher;
  }

  const call = getOrCreateCallObject();
  switch (call.meetingState()) {
    case "new":
      call
        .startCamera()
        .then(() => {
          completionHandler();
        })
        .catch((err) => {
          completionHandler(new Error("Failed to start camera"));
          console.error("startCamera error: ", err);
        });
      break;
    case "loading":
      console.debug("loading");
      break;
    case "loaded":
      console.debug("loaded");
      break;
    case "joining-meeting":
      console.debug("joining-meeting");
      break;
    case "joined-meeting":
      console.debug("joined-meeting");
      break;
    case "left-meeting":
      console.debug("left-meeting");
      break;
    case "error":
      console.debug("error");
      completionHandler(new Error("Daily error"));
      return publisher;
    default:
      break;
  }

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .then((res) => {
      console.log(res);
      completionHandler();
    })
    .catch((e) => {
      completionHandler(e as OTError);
    });

  const localParticipant = call.participants().local;
  let videoOn = false;
  let audioOn = false;
  if (localParticipant) {
    videoOn = localParticipant.video;
    audioOn = localParticipant.audio;
  }

  if (!window.call) {
    dailyUndefinedError();
  }

  if (videoOn || audioOn) {
    updateMediaDOM(localParticipant, publisher, rootElementID);
  }
  if (!videoOn) {
    window.call.setLocalVideo(true);
  }
  if (!audioOn) {
    window.call.setLocalAudio(true);
  }

  return publisher;
}
