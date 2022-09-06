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
import Daily from "@daily-co/daily-js";
import { OTEventEmitter } from "./OTEventEmitter";
import { dailyUndefinedError, notImplemented } from "./utils";
import { Session } from "./Session";

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
  private dailySources: Daily.DailyDeviceInfos;
  accessAllowed: boolean;
  element?: HTMLElement | undefined;
  height?: string;
  id?: string;
  insertMode?: "replace" | "after" | "before" | "append";
  session?: Session;
  stream?: Stream;
  width?: string;
  constructor({ width, height, insertMode }: PublisherProperties) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;
    this.accessAllowed = true;

    window.call =
      window.call ??
      Daily.createCallObject({
        subscribeToTracksAutomatically: false,
        dailyConfig: {
          experimentalChromeVideoMuteLightOff: true,
        },
      });

    window.call
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
      });
  }

  destroy(): void {
    if (!window.call) {
      dailyUndefinedError();
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
      })
      .catch((err) => {
        console.error(err);
      });
  }
  getImgData(): string | null {
    notImplemented();
  }
  getStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {
    notImplemented();
  }
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(notImplemented());
    });
  }
  getStyle(): PublisherProperties {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(notImplemented());
    });
  }
  getVideoFilter(): VideoFilter | null {
    notImplemented();
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(notImplemented());
    });
  }
  publishAudio(value: boolean): void {
    if (!window.call) {
      dailyUndefinedError();
    }
    window.call.setLocalAudio(value);
  }
  publishVideo(value: boolean): this {
    if (!window.call) {
      dailyUndefinedError();
    }
    window.call.setLocalVideo(value);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishCaptions(value: boolean): void {
    notImplemented();
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    if (!window.call) {
      dailyUndefinedError();
    }

    return window.call.cycleCamera().then((device) => {
      return { deviceId: String(device) };
    });
  }
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    if (!window.call) {
      dailyUndefinedError();
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
      dailyUndefinedError();
    }
    const { local: { tracks: { audio: { persistentTrack } = {} } = {} } = {} } =
      window.call.participants();

    return persistentTrack ?? null;
  }
  setVideoSource(videoSourceId: string): Promise<undefined> {
    if (!window.call) {
      dailyUndefinedError();
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
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoContentHint(hint: VideoContentHint): void {
    notImplemented();
  }
  async getVideoSource(): Promise<{
    deviceId: string | null;
    type: "camera" | "screen" | "custom" | null;
    track: MediaStreamTrack | null;
  } {
    if (!window.call) {
      dailyUndefinedError();
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
    notImplemented();
  }
  videoWidth(): number | undefined {
    notImplemented();
  }
  videoHeight(): number | undefined {
    notImplemented();
  }
}
