import { DailyParticipant } from "@daily-co/daily-js";

export function notImplemented(): never {
  throw new Error("Method not implemented.");
}

export function mediaId(
  strings: TemplateStringsArray,
  media: MediaStreamTrack | MediaStream,
  sessionId: string
): string {
  const kind =
    media instanceof MediaStream
      ? media
          .getTracks()
          .map((t) => t.kind)
          .join("-")
      : media.kind;

  return `${kind}${strings[1]}${sessionId}`;
}

export const getParticipantTracks = ({ tracks }: DailyParticipant) => {
  const { audio: at, screenVideo: st, video: vt } = tracks;

  const video = vt.state === "playable" ? vt.persistentTrack : null;
  const audio = at.state === "playable" ? at.persistentTrack : null;
  const screen = st.state === "playable" ? st.persistentTrack : null;

  return { video, audio, screen };
};
