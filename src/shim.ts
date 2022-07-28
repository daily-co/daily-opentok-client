import * as OT from "@opentok/client";

class Publisher {
  constructor(properties) {
    console.log("publisher constructor", properties);
  }
  publish() {
    console.log("publish");
  }

  once() {
    console.log("once");
  }
}

class Session {
  constructor(properties) {
    console.log("session constructor", properties);
  }
  on() {
    console.log("on");
  }
  publish() {
    console.log("publish");
  }
  connect() {
    console.log("connect");
  }
  subscribe() {
    console.log("subscribe");
  }
}

export function initSession(
  partnerId: string,
  sessionId: string,
  options?: any // Use the right open tok type later.
): OT.Session {
  if (sessionId == null) {
    sessionId = apiKey;
    apiKey = null;
  } // Allow buggy legacy behavior to succeed, where the client can connect if sessionId
  // is an array containing one element (the session ID), but fix it so that sessionId
  // is stored as a string (not an array):

  if (Array.isArray(sessionId) && sessionId.length === 1) {
    sessionId = sessionId[0];
  }

  let session = sessionObjects.sessions.get(sessionId);

  if (!session) {
    session = new Session(apiKey, sessionId, opt);
    sessionObjects.sessions.add(session);
  }

  return session;
}

export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OT.OTError | undefined) => void) | undefined
): OT.Publisher {
  // TODO(jamsea): Need checking to make sure that the target element is a valid element.

  const publisher = new Publisher(properties || {});

  const err = null;

  if (err && callback) {
    callback(err);
  }

  publisher.once("initSuccess", removeInitSuccessAndCallComplete);
  publisher.once("publishComplete", removeHandlersAndCallComplete);
  publisher.publish(targetElement);
  return publisher;
}

// window.OT.initSession = initSession;
// window.OT.initPublisher = initPublisher;
