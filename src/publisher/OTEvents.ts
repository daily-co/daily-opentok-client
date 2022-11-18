import { Event, Stream, Subscriber } from "@opentok/client";
import { Publisher } from "./Publisher";

type StreamCreatedEvent = Event<"streamCreated", Publisher> & {
  stream: Stream;
};

type StreamDestroyedEvent = Event<"streamDestroyed", Publisher> & {
  stream: Stream;
  reason: string;
};

// Can be Publisher or Subscriber
type VideoElementCreatedEvent = Event<
  "videoElementCreated",
  Subscriber | Publisher
> & {
  element: HTMLVideoElement | HTMLObjectElement;
};

export function getStreamCreatedEvent(
  target: Publisher,
  stream: Stream
): StreamCreatedEvent {
  // Format as an opentok event
  let defaultPrevented = false;
  const streamEvent: StreamCreatedEvent = {
    type: "streamCreated",
    isDefaultPrevented: () => defaultPrevented,
    preventDefault: () => {
      defaultPrevented = true;
    },
    target: target,
    cancelable: true,
    stream,
  };
  return streamEvent;
}

export function getStreamDestroyedEvent(
  target: Publisher,
  stream: Stream
): StreamDestroyedEvent {
  let preventedDefault = false;
  const event: StreamDestroyedEvent = {
    type: "streamDestroyed",
    reason: "clientDisconnected",
    target: target,
    cancelable: true,
    stream,
    isDefaultPrevented: () => preventedDefault,
    preventDefault: () => {
      preventedDefault = true;
      return true;
    },
  };
  return event;
}

export function getVideoElementCreatedEvent(
  element: HTMLVideoElement,
  target: Publisher | Subscriber
): VideoElementCreatedEvent {
  const videoElementCreatedEvent: VideoElementCreatedEvent = {
    type: "videoElementCreated",
    element,
    target,
    cancelable: true,
    isDefaultPrevented: () => false,
    preventDefault: () => false,
  };

  return videoElementCreatedEvent;
}
