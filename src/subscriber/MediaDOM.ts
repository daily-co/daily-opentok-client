import { OTError, SubscriberProperties } from "@opentok/client";
import { getVideoElementCreatedEvent } from "../publisher/OTEvents";
import { createOrUpdateMedia, Dimensions, Tracks } from "../shared/media";
import { toCSSDimensions } from "../shared/utils";
import { Subscriber } from "./Subscriber";

export function addOrUpdateMedia(
  subscriber: Subscriber,
  sessionID: string,
  mediaTracks: Tracks,
  root: HTMLElement,
  properties?: SubscriberProperties | ((error?: OTError) => void)
): HTMLVideoElement {
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
  const { videoEl, isNew } = createOrUpdateMedia(
    sessionID,
    mediaTracks,
    dimensions
  );
  // Only attach if insertDefaultUI is true
  if (isNew) {
    subscriber.ee.emit(
      "videoElementCreated",
      getVideoElementCreatedEvent(videoEl, subscriber)
    );
    if (insertDefaultUI) root.appendChild(videoEl);
  }
  return videoEl;
}
