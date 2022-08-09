import { OTError, Event, Stream } from "@opentok/client";
import Daily, { DailyEventObjectTrack } from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";

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

  window.call = Daily.createCallObject({
    subscribeToTracksAutomatically: true,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });

  window.call
    .on("track-started", (dailyEvent) => {
      if (!dailyEvent) {
        console.debug("No Daily event");
        return;
      }

      if (dailyEvent.participant?.local) {
        console.debug("Local participant, do not fire opentok event.");
        return;
      }

      const {
        frameRate = 0,
        height = 0,
        width = 0,
      } = dailyEvent.track.getSettings();

      const creationTime = dailyEvent.participant?.joined_at
        ? dailyEvent.participant.joined_at.getTime()
        : new Date().getTime();

      let defaultPrevented = false;

      type DailyStream = Stream & {
        dailyEvent: DailyEventObjectTrack;
      };
      type StreamCreatedEvent = Event<"streamCreated", Session> & {
        stream: DailyStream;
      };

      // Format as an opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          defaultPrevented = true;
        },
        target: session,
        cancelable: true,
        stream: {
          // Maybe this is like user_id in daily?
          streamId: dailyEvent.participant?.user_id ?? "",
          frameRate,
          hasAudio: dailyEvent.track.kind === "audio",
          hasVideo: dailyEvent.track.kind === "video",
          // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
          name: "",
          videoDimensions: {
            height,
            width,
          },
          videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
          creationTime,
          connection: {
            connectionId: "connectionId", // TODO
            creationTime,
            // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
            // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
            // we need to listen to participant-joined instead of track-started
            data: "",
          },
          // Append the Daily Event to the stream object so customers can "break out" of opentok if they want to
          dailyEvent,
        },
      };

      session.ee.emit("streamCreated", streamEvent);
    })
    .on("track-stopped", () => {
      // TODO(jamsea): emit streamDestroyed event
    })
    .on("error", () => {
      // TODO(jamsea): emit error event
    })
    .on("nonfatal-error", () => {
      // TODO(jamsea): emit error event
    })
    .on("network-connection", (dailyEvent) => {
      console.debug("network-connection", dailyEvent);
      if (!dailyEvent) {
        return;
      }

      let defaultPrevented = false;
      const tokboxEvent: Event<"sessionDisconnected", Session> & {
        reason: string;
      } = {
        type: "sessionDisconnected",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          defaultPrevented = true;
        },
        cancelable: true,
        target: session,
        reason: "networkDisconnected",
      };

      switch (dailyEvent.event) {
        case "interrupted":
          session.ee.emit("sessionDisconnected", tokboxEvent);
          break;
        case "connected":
          console.debug("connected");
          break;
        default:
          break;
      }
    })
    .on("network-quality-change", () => {
      // TODO(jamsea): emit networkQualityChange event
    })
    .on("left-meeting", (dailyEvent) => {
      console.debug("left-meeting", dailyEvent);
      if (!dailyEvent) {
        return;
      }

      let defaultPrevented = false;

      const tokboxEvent: Event<"sessionDisconnected", OT.Session> & {
        reason: string;
      } = {
        type: "sessionDisconnected",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          defaultPrevented = true;
        },
        cancelable: true,
        target: session,
        reason: "clientDisconnected",
      };

      session.ee.emit("sessionDisconnected", tokboxEvent);
    })
    .on("participant-left", (dailyEvent) => {
      if (!dailyEvent) return;

      const v = document.getElementById(
        `video-${dailyEvent.participant.user_id}`
      );
      if (v) {
        v.remove();
      }
    });

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

  const dailyElementId =
    targetElement instanceof HTMLElement ? targetElement.id : targetElement;

  const publisher = new Publisher({
    width: properties?.width ?? "100%",
    height: properties?.height ?? "100%",
    insertMode: properties?.insertMode,
    dailyElementId,
  });

  return publisher;
}
