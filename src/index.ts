import { OTError } from "@opentok/client";
import Daily from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";

export function notImplemented(): never {
  throw new Error("Method not implemented.");
}

export function checkSystemRequirements() {
  return Daily.supportedBrowser();
}

export function upgradeSystemRequirements() {
  // Left empty
  console.debug("upgradeSystemRequirements called");
}

export function getDevices(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  callback: (error: OTError | undefined, devices?: OT.Device[]) => void
): void {
  // TODO(daily): implement
}

// FROM DOCS:
// Note that calling OT.initSession() does not initiate
// communications with the cloud. It simply initializes
// the Session object that you can use to connect (and
// to perform other operations once connected).
export function initSession(
  // Doesn't look like Daily needs this at all, but it's required by the opentok API
  partnerId: string,
  // sessionId in tokbox, renamed this to roomUrl to match the Daily API
  roomUrl: string,
  options?: {
    connectionEventsSuppressed?: boolean;
    iceConfig?: {
      includeServers: "all" | "custom";
      transportPolicy: "all" | "relay";
      customServers: {
        urls: string | string[];
        username?: string;
        credential?: string;
      }[];
    };
    ipWhitelist?: boolean;
    encryptionSecret?: string;
  }
): Session {
  const session = new Session(partnerId, roomUrl, options);

  return session;
}

export function initPublisher(
  targetElement?: string | HTMLElement | undefined,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): initPublisher function signature needs
  // all of it's edge cases checked (e.g. no targetElement, no properties, etc)

  if (!targetElement) {
    callback?.({
      message: "No target element provided",
      name: "OTError",
    });
    throw new Error("No target element provided");
  }

  const publisher = new Publisher({
    width: properties?.width ?? "100%",
    height: properties?.height ?? "100%",
    insertMode: properties?.insertMode,
  });

  const dailyElementId =
    targetElement instanceof HTMLElement ? targetElement.id : targetElement;

  window.call =
    window.call ??
    Daily.createCallObject({
      subscribeToTracksAutomatically: false,
      dailyConfig: {
        experimentalChromeVideoMuteLightOff: true,
      },
    });

  window.call.startCamera().catch((err) => {
    console.error("startCamera error: ", err);
  });

  window.call.on("participant-updated", (dailyEvent) => {
    console.debug("[participant-updated] index", dailyEvent);
    if (!dailyEvent?.participant.local) {
      return;
    }

    const { videoTrack, audioTrack, session_id } = dailyEvent.participant;

    if (!videoTrack || !audioTrack) {
      console.log("No video track with local");
      return;
    }

    let t = document.getElementById(dailyElementId) as HTMLDivElement | null;

    if (t === null) {
      t = document.createElement("div");
      document.body.appendChild(t);
    }

    const documentVideoElm = document.getElementById(`video-${session_id}`);

    const videoEl =
      documentVideoElm instanceof HTMLVideoElement
        ? documentVideoElm
        : document.createElement("video");

    // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
    if (publisher.insertMode === "append") {
      t.appendChild(videoEl);
    }
    videoEl.style.width = publisher.width ?? "";
    videoEl.style.height = publisher.height ?? "";
    videoEl.srcObject = new MediaStream([videoTrack, audioTrack]);
    videoEl.id = `video-${session_id}`;
    videoEl.play().catch((e) => {
      console.error("ERROR LOCAL CAMERA PLAY");
      console.error(e);
    });
  });

  window.call.setLocalVideo(true);
  window.call.setLocalAudio(true);

  return publisher;
}
