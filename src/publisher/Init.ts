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

  const completionHandler =
    typeof callback === "function"
      ? callback
      : () => {
          // empty
        };

  // Instantiate publisher with provided properties
  const publisher = new Publisher(
    {
      width: properties?.width ?? "",
      height: properties?.height ?? "",
      insertMode: properties?.insertMode,
      showControls: properties?.showControls ?? false,
      publishAudio: properties?.publishAudio ?? true,
      publishVideo: properties?.publishVideo ?? true,
    },
    rootElementID,
    completionHandler
  );

  // If target element is falsy, invoke completion handler
  // with an error
  if (!targetElement) {
    completionHandler(new Error("No target element provided"));
    return publisher;
  }

  const call = getOrCreateCallObject();

  switch (call.meetingState()) {
    case "new":
    case "left-meeting":
    case "loading":
    case "loaded":
      call.startCamera().catch((err) => {
        completionHandler(new Error("Failed to start camera"));
        console.error("startCamera error: ", err);
      });
      break;
    case "error":
      console.error("error");
      break;
    // Validate call state: startCamera() is only allowed if you haven't
    // already joined (or aren't in the process of joining).
    case "joined-meeting":
    case "joining-meeting":
      call.updateParticipant("local", {
        setAudio: properties?.publishAudio ?? true,
        setVideo: properties?.publishVideo ?? true,
      });
      break;
    default:
      console.log("---  init meetingState: ", call.meetingState());
  }

  return publisher;
}
