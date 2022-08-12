import { DailyParticipant } from "@daily-co/daily-js";

export function notImplemented(): never {
  throw new Error("Method not implemented.");
}

export function createDivId(sessionId: string): string {
  return `${sessionId}-video`;
}

export const getParticipantTracks = ({ tracks }: DailyParticipant) => {
  const vt = tracks.video;
  const at = tracks.audio;
  const st = tracks.screenVideo;

  const video = vt.state === "playable" ? vt.persistentTrack : null;
  const audio = at.state === "playable" ? at.persistentTrack : null;
  const screen = st.state === "playable" ? st.persistentTrack : null;

  return { video, audio, screen };
};
