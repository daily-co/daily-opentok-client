import { DailyParticipant } from "@daily-co/daily-js";

export type Tracks = {
  audio?: MediaStreamTrack | null;
  video?: MediaStreamTrack | null;
  screen?: MediaStreamTrack | null;
};

export function notImplemented(name = "unknown"): never {
  throw new Error(`Function or operation not implemented: ${name}`);
}

export function dailyUndefinedError(): never {
  throw new Error("Daily call object not initialized.");
}

export const getParticipantTracks = ({ tracks }: DailyParticipant): Tracks => {
  const { audio: at, screenVideo: st, video: vt } = tracks;

  const validStates = ["playable", "interrupted", "loading"];
  const video = validStates.includes(vt.state) ? vt.persistentTrack : null;
  const audio = validStates.includes(at.state) ? at.persistentTrack : null;
  const screen = validStates.includes(st.state) ? st.persistentTrack : null;

  return {
    video: video,
    audio: audio,
    screen: screen,
  };
};
