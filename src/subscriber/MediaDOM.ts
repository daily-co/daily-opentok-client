import { OTError, SubscriberProperties } from "@opentok/client";
import { getVideoElementCreatedEvent } from "../publisher/OTEvents";
import { createOrUpdateMedia, Dimensions, Tracks } from "../shared/media";
import { toCSSDimensions } from "../shared/utils";
import { DailyEventHandler } from "./DailyEventHandler";

export function addOrUpdateMedia(
  dailyEventHandler: DailyEventHandler,
  sessionID: string,
  mediaTracks: Tracks,
  root: HTMLElement,
  properties?: SubscriberProperties | ((error?: OTError) => void)
) {
  const dimensions = {
    width: "",
    height: "",
  } as Dimensions;

  let insertDefaultUI = true;
  if (properties && typeof properties !== "function") {
    insertDefaultUI = properties.insertDefaultUI ?? true;
    const w = properties.width;
    const h = properties.height;
    if (w) dimensions.width = toCSSDimensions(w);
    if (h) dimensions.height = toCSSDimensions(h);
  }
  const videoData = createOrUpdateMedia(sessionID, mediaTracks, dimensions);
  if (videoData.isNew) {
    // Only attach if insertDefaultUI is false
    if (!insertDefaultUI) root.appendChild(videoData.videoEl);
  }
  return videoData;
}
