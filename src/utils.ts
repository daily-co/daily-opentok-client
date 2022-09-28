import { DailyParticipant } from "@daily-co/daily-js";

export function notImplemented(): never {
  throw new Error("Method not implemented.");
}

export function getVideoTagID(sessionID: string) {
  return `video-${sessionID}`;
}

export const getParticipantTracks = ({ tracks }: DailyParticipant) => {
  const { audio: at, screenVideo: st, video: vt } = tracks;

  const video = vt.state === "playable" ? vt.persistentTrack : null;
  const audio = at.state === "playable" ? at.persistentTrack : null;
  const screen = st.state === "playable" ? st.persistentTrack : null;

  return { video, audio, screen };
};
