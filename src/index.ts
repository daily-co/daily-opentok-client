import { OTError, Event, Stream } from "@opentok/client";
import Daily, { DailyEventObjectTrack } from "@daily-co/daily-js";
import { Publisher } from "./Publisher";
import { Session } from "./Session";

type DailyStream = Stream & {
  dailyEvent: DailyEventObjectTrack;
};

type StreamCreatedEvent = Event<"streamCreated", Session> & {
  stream: DailyStream;
};

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
      const cancelable = true;

      // Format as opentok event
      const streamEvent: StreamCreatedEvent = {
        type: "streamCreated",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          if (cancelable) {
            defaultPrevented = true;
          } else {
            console.warn(
              "Event.preventDefault :: Trying to preventDefault on an " +
                "event that isn't cancelable"
            );
          }
        },
        target: session,
        cancelable,
        stream: {
          // Maybe this is like user_id in daily?
          streamId: dailyEvent.participant?.user_id || "",
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
    .on("track-stopped", (dailyEvent) => {})
    .on("error", (error) => {})
    .on("nonfatal-error", (error) => {})
    .on("network-connection", (dailyEvent) => {
      console.debug("network-connection", dailyEvent);
      if (!dailyEvent) {
        return;
      }

      let defaultPrevented = false;
      const cancelable = true;

      switch (dailyEvent.event) {
        case "interrupted":
          const tokboxEvent: Event<"sessionDisconnected", Session> & {
            reason: string;
          } = {
            type: "sessionDisconnected",
            isDefaultPrevented: () => defaultPrevented,
            preventDefault: () => {
              if (cancelable) {
                defaultPrevented = true;
              } else {
                console.warn(
                  "Event.preventDefault :: Trying to preventDefault on an " +
                    "event that isn't cancelable"
                );
              }
            },
            cancelable,
            target: session,
            reason: "networkDisconnected",
          };
          session.ee.emit("sessionDisconnected", tokboxEvent);
          break;
        case "connected":
          console.debug("connected");
          break;
        default:
          break;
      }
    })
    .on("network-quality-change", (dailyEvent) => {})
    .on("left-meeting", (dailyEvent) => {
      console.debug("left-meeting", dailyEvent);
      if (!dailyEvent) {
        return;
      }

      let defaultPrevented = false;
      const cancelable = true;

      const tokboxEvent: Event<"sessionDisconnected", OT.Session> & {
        reason: string;
      } = {
        type: "sessionDisconnected",
        isDefaultPrevented: () => defaultPrevented,
        preventDefault: () => {
          if (cancelable) {
            defaultPrevented = true;
          } else {
            console.warn(
              "Event.preventDefault :: Trying to preventDefault on an " +
                "event that isn't cancelable"
            );
          }
        },
        cancelable: false,
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
  targetElement?: string | undefined, // | HTMLElement,
  properties?: OT.PublisherProperties | undefined,
  callback?: ((error?: OTError | undefined) => void) | undefined
): Publisher {
  // TODO(jamsea): initPublisher function signature needs
  // all of it's edge cases checked (e.g. no targetElement, no properties, etc)
  const publisher = new Publisher({
    width: properties?.width || "100%",
    height: properties?.height || "100%",
    insertMode: properties?.insertMode,
    dailyElementId: targetElement,
  });

  const err = null;

  if (err && callback) {
    callback(err);
  }

  return publisher;
}
