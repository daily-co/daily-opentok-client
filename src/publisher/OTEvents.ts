import { Event, Stream } from "@opentok/client";
import { Publisher } from "./Publisher";

type StreamCreatedEvent = Event<"streamCreated", Publisher> & {
  stream: Stream;
};

type StreamDestroyedEvent = Event<"streamDestroyed", Publisher> & {
  stream: Stream;
  reason: string;
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
