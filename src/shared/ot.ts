import { DailyParticipant } from "@daily-co/daily-js";
import { Stream } from "@opentok/client";

// createStream() creats and returns an OT stream using data
// from the givenp participant.
export function createStream(participant: DailyParticipant): Stream {
  const {
    session_id,
    audio,
    video,
    tracks,
    joined_at = new Date(),
    user_id,
  } = participant;
  const creationTime = joined_at.getTime();

  const settings = tracks.video.track?.getSettings() ?? {};
  const { frameRate = 0, height = 0, width = 0 } = settings;

  const connection = {
    connectionId: user_id,
    creationTime,
    data: "{}",
  };

  const stream: Stream = {
    streamId: session_id,
    frameRate,
    hasAudio: audio,
    hasVideo: video,
    // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
    name: "",
    videoDimensions: {
      height,
      width,
    },
    videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
    creationTime,
    connection: connection,
  };
  return stream;
}
