import {
  Event,
  OTError,
  PublisherRtcStatsReportArr,
  PublisherStatsArr,
  PublisherStyle,
  PublisherProperties,
  Stream,
  VideoContentHint,
  VideoDimensionsChangedEvent,
  VideoFilter,
} from "@opentok/client";
import { OTEventEmitter } from "../OTEventEmitter";
import { Session } from "../session/Session";
import { errDailyUndefined, errNotImplemented } from "../shared/errors";
import { removeAllParticipantMedias } from "../shared/media";
import {
  getOrCreateCallObject,
} from "../shared/utils";
import { updateMediaDOM } from "./MediaDOM";

export type InsertMode = "replace" | "after" | "before" | "append";

export class Publisher extends OTEventEmitter<{
  accessAllowed: Event<"accessAllowed", Publisher>;
  accessDenied: Event<"accessDenied", Publisher>;
  accessDialogClosed: Event<"accessDialogClosed", Publisher>;
  accessDialogOpened: Event<"accessDialogOpened", Publisher>;

  audioLevelUpdated: Event<"audioLevelUpdated", Publisher> & {
    audioLevel: number;
  };

  destroyed: Event<"destroyed", Publisher>;

  mediaStopped: Event<"mediaStopped", Publisher> & {
    track: MediaStreamTrack | undefined;
  };

  streamCreated: Event<"streamCreated", Publisher> & {
    stream: Stream;
  };

  streamDestroyed: Event<"streamDestroyed", Publisher> & {
    stream: Stream;
    reason: string;
  };

  videoDimensionsChanged: VideoDimensionsChangedEvent<Publisher>;

  videoElementCreated: Event<"videoElementCreated", Publisher> & {
    element: HTMLVideoElement | HTMLObjectElement;
  };

  muteForced: Event<"muteForced", Publisher>;
}> {
  accessAllowed: boolean;
  element?: HTMLElement | undefined;
  height?: string;
  id?: string;
  insertMode?: InsertMode;
  session?: Session;
  stream?: Stream;
  width?: string;
  constructor(
    { width, height, insertMode }: PublisherProperties,
    rootElementID?: string
  ) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;
    this.accessAllowed = true;

    const call = getOrCreateCallObject();

    call
      .on("started-camera", () => {
        this.accessAllowed = true;
        this.ee.emit("accessAllowed");
        console.debug(
          "accessAllowed Count",
          this.ee.listenerCount("accessAllowed"),
          this.ee.listeners("accessAllowed")
        );
      })
      .on("camera-error", (error) => {
        if (!error) return;

        if (error.errorMsg.errorMsg === "not allowed") {
          this.ee.emit("accessDenied");
          this.accessAllowed = false;
        }
      })
      .on("track-started", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }

        const { participant } = dailyEvent;
        // LIZA todo: do we need completion handler here?
        updateMediaDOM(participant, this, rootElementID);
      })
      .on("track-stopped", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }

        const { participant } = dailyEvent;
        // LIZA todo: do we need completion handler here?
        updateMediaDOM(participant, this, rootElementID);
      })
      .on("left-meeting", () => {
        removeAllParticipantMedias();
      });

    const localParticipant = call.participants().local;
    let videoOn = false;
    let audioOn = false;
    if (localParticipant) {
      videoOn = localParticipant.video;
      audioOn = localParticipant.audio;
    }

    if (videoOn || audioOn) {
      updateMediaDOM(localParticipant, this, rootElementID);
    }
    if (!videoOn) {
      call.setLocalVideo(true);
    }
    if (!audioOn) {
      call.setLocalAudio(true);
    }
  }

  destroy(): void {
    if (!window.call) {
      errDailyUndefined();
    }
    window.call
      .leave()
      .then(() => {
        this.ee.emit("streamDestroyed", {
          isDefaultPrevented: () => false,
          preventDefault: () => false,
          reason: "disconnected",
          cancelable: false,
          stream: null,
        });
        this.ee.emit("destroyed", {
          isDefaultPrevented: () => false,
          preventDefault: () => false,
          reason: "disconnected",
          cancelable: false,
          stream: null,
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }
  getImgData(): string | null {
    errNotImplemented(this.getImgData.name);
  }
  getStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {
    errNotImplemented(this.getStats.name);
  }
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.getRtcStatsReport.name));
    });
  }
  getStyle(): PublisherProperties {
    errNotImplemented(this.getStyle.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.applyVideoFilter.name));
    });
  }
  getVideoFilter(): VideoFilter | null {
    errNotImplemented(this.getVideoFilter.name);
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.clearVideoFilter.name));
    });
  }
  publishAudio(value: boolean): void {
    if (!window.call) {
      errDailyUndefined();
    }
    window.call.setLocalAudio(value);
  }
  publishVideo(value: boolean): this {
    if (!window.call) {
      errDailyUndefined();
    }
    window.call.setLocalVideo(value);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishCaptions(value: boolean): void {
    errNotImplemented(this.publishCaptions.name);
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    if (!window.call) {
      errDailyUndefined();
    }

    return window.call.cycleCamera().then((device) => {
      return { deviceId: String(device) };
    });
  }
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    if (!window.call) {
      errDailyUndefined();
    }

    const audioDeviceId =
      typeof audioSource === "string" ? audioSource : audioSource.id;

    return window.call
      .setInputDevicesAsync({
        audioDeviceId,
      })
      .then(() => {
        return undefined;
      });
  }
  getAudioSource(): MediaStreamTrack | null {
    if (!window.call) {
      errDailyUndefined();
    }
    const { local: { tracks: { audio: { persistentTrack } = {} } = {} } = {} } =
      window.call.participants();

    return persistentTrack ?? null;
  }
  setVideoSource(videoSourceId: string): Promise<undefined> {
    if (!window.call) {
      errDailyUndefined();
    }

    return window.call
      .setInputDevicesAsync({
        videoDeviceId: videoSourceId,
      })
      .then(() => {
        return undefined;
      });
  }
  getVideoContentHint(): VideoContentHint {
    errNotImplemented(this.getVideoContentHint.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoContentHint(hint: VideoContentHint): void {
    errNotImplemented(this.setVideoContentHint.name);
  }
  getVideoSource(): {
    deviceId: string | null;
    type: "camera" | "screen" | "custom" | null;
    track: MediaStreamTrack | null;
  } {
    if (!window.call) {
      errDailyUndefined();
    }
    const { local: { tracks: { video: { persistentTrack } = {} } = {} } = {} } =
      window.call.participants();
    return {
      deviceId: persistentTrack?.id ?? null,
      type: "camera",
      track: persistentTrack ?? null,
    };
  }
  setStyle<Style extends keyof PublisherStyle>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    style: Style,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: PublisherStyle[Style]
  ): void {
    errNotImplemented(`publisher ${this.setStyle.name}`);
  }
  videoWidth(): number | undefined {
    errNotImplemented(`publisher ${this.videoWidth.name}`);
  }
  videoHeight(): number | undefined {
    errNotImplemented(`publisher ${this.videoHeight.name}`);
  }
}
