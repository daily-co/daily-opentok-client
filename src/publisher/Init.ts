import { OTError } from "@opentok/client";
import { Publisher } from "./Publisher";
import { getOrCreateCallObject } from "../shared/utils";

// initPublisher() sets up and returns a Publisher to the caller
export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OTError | undefined) => void) | undefined
): Publisher {
  // Get ID of the element to which all publisher media will be attached
  const rootElementID =
    targetElement instanceof HTMLElement ? targetElement.id : targetElement;

  // Instantiate publisher with provided properties
  const publisher = new Publisher({
    width: properties?.width ?? "",
    height: properties?.height ?? "",
    insertMode: properties?.insertMode,
    showControls: properties?.showControls ?? false,
  });

  const completionHandler =
    typeof callback === "function"
      ? callback
      : () => {
          // empty
        };

  const call = getOrCreateCallObject();

  // Address current meeting state
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

  // TODO: [Liza] - is this for the network test parts?
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

  return publisher;
}
