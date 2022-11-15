import { OTError, SubscriberProperties } from "@opentok/client";
import { createOrUpdateMedia, Dimensions, Tracks } from "../shared/media";
import { toCSSDimensions } from "../shared/utils";

export function addOrUpdateMedia(
  sessionID: string,
  mediaTracks: Tracks,
  root: HTMLElement,
  properties?: SubscriberProperties | ((error?: OTError) => void)
): HTMLVideoElement {
  const dimensions = {
    width: "",
    height: "",
  } as Dimensions;

  if (properties && typeof properties !== "function") {
    const w = properties.width;
    const h = properties.height;
    if (w) dimensions.width = toCSSDimensions(w);
    if (h) dimensions.height = toCSSDimensions(h);
  }
  const videoData = createOrUpdateMedia(sessionID, mediaTracks, dimensions);
  if (videoData.isNew) {
    root.appendChild(videoData.video);
  }
  return videoData.video;
}
