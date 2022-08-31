import { DailyParticipant } from "@daily-co/daily-js";

export function notImplemented(): never {
  throw new Error("Method not implemented.");
}

export function mediaId(
  media: MediaStreamTrack | MediaStream | string,
  sessionId: string
): string {
  if (typeof media === "string") {
    return `${media}-${sessionId}`;
  }

  const kind =
    media instanceof MediaStream
      ? media
          .getTracks()
          .map((t) => t.kind)
          .join("-")
      : media.kind;

  return `${kind}-${sessionId}`;
}

export const getParticipantTracks = ({ tracks }: DailyParticipant) => {
  const {
    audio: at,
    screenVideo: svt,
    video: vt,
    screenAudio: sat,
    rmpAudio: rat = { state: "off" },
    rmpVideo: rvt = { state: "off" },
  } = tracks;

  const video = vt.state === "playable" ? vt.persistentTrack : null;
  const audio = at.state === "playable" ? at.persistentTrack : null;
  const screenVideo = svt.state === "playable" ? svt.persistentTrack : null;
  const screenAudio = sat.state === "playable" ? sat.persistentTrack : null;
  const rmpVideo = rvt.state === "playable" ? rvt.persistentTrack : null;
  const rmpAudio = rat.state === "playable" ? rat.persistentTrack : null;

  return { video, audio, screenVideo, screenAudio, rmpVideo, rmpAudio };
};
