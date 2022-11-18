import { Connection, Event, Stream } from "@opentok/client";
import { Session } from "./Session";

type StreamCreatedEvent = Event<"streamCreated", Session> & {
  stream: Stream;
};

type StreamDestroyedEvent = Event<"streamDestroyed", Session> & {
  stream: Stream;
  reason: string;
};

type ConnectionCreatedEvent = Event<"connectionCreated", Session> & {
  connection: Connection;
};

type ConnectionDestroyedEvent = Event<"connectionDestroyed", Session> & {
  connection: Connection;
  reason: string;
};

type SessionDisconnectedEvent = Event<"sessionDisconnected", Session> & {
  reason: string;
};

export function getStreamCreatedEvent(
  target: Session,
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
  target: Session,
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

export function getConnectionCreatedEvent(
  target: Session,
  connection: Connection
): ConnectionCreatedEvent {
  let preventedDefault = false;
  const connectionCreatedEvent: ConnectionCreatedEvent = {
    type: "connectionCreated",
    target: target,
    cancelable: true,
    connection,
    isDefaultPrevented: () => preventedDefault,
    preventDefault: () => {
      preventedDefault = true;
      return true;
    },
  };

  return connectionCreatedEvent;
}

export function getConnectionDestroyedEvent(
  target: Session,
  connection: Connection
): ConnectionDestroyedEvent {
  let preventedDefault = false;
  const event: Event<"connectionDestroyed", Session> & {
    connection: Connection;
    reason: string;
  } = {
    type: "connectionDestroyed",
    connection,
    isDefaultPrevented: () => preventedDefault,
    preventDefault: () => {
      preventedDefault = true;
      return true;
    },
    cancelable: false,
    target: target,
    reason: "clientDisconnected",
  };
  return event;
}

export function getSessionDisconnectedEvent(
  target: Session
): SessionDisconnectedEvent {
  let defaultPrevented = false;
  const event: Event<"sessionDisconnected", Session> & {
    reason: string;
  } = {
    type: "sessionDisconnected",
    isDefaultPrevented: () => defaultPrevented,
    preventDefault: () => {
      defaultPrevented = true;
    },
    cancelable: true,
    target: target,
    reason: "networkDisconnected",
  };
  return event;
}
