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
  accessAllowed: boolean;
  element?: HTMLElement | undefined;
  height?: string;
  id?: string;
  insertMode?: "replace" | "after" | "before" | "append";
  session?: Session;
  stream?: Stream;
  width?: string;
  constructor({
    width,
    height,
    insertMode,
    insertDefaultUI = false,
    resolution,
    frameRate,
    showControls = false,
    publishAudio = false,
    publishVideo = false,
  }: PublisherProperties) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;
    this.accessAllowed = true;
    this.width = "";
    this.height = "";
    this.publishAudio(publishAudio);
    this.publishVideo(publishVideo);
    this.id = "daily-root"; //TODO(jamsea): Don't hardcode this

    const deviceId = this.getVideoSource().deviceId;

    if (deviceId) {
      this.setVideoSource(deviceId);
    }

    // Element should be undefined if insertDefaultUI is false
    // https://tokbox.com/developer/sdks/js/reference/Publisher.html
    if (!insertDefaultUI) {
      this.element = undefined;
    }

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
    notImplemented(this.getImgData.name);
  }
  getStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {
    notImplemented(this.getStats.name);
  }
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(notImplemented(this.getRtcStatsReport.name));
    });
  }
  getStyle(): PublisherProperties {
    notImplemented(this.getStyle.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(notImplemented(this.applyVideoFilter.name));
    });
  }
  getVideoFilter(): VideoFilter | null {
    notImplemented(this.getVideoFilter.name);
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(notImplemented(this.clearVideoFilter.name));
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
    notImplemented(this.publishCaptions.name);
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
      .then((res) => {
        console.log(res);
        return undefined;
      });
  }
  getVideoContentHint(): VideoContentHint {
    notImplemented(this.getVideoContentHint.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoContentHint(hint: VideoContentHint): void {
    notImplemented(this.setVideoContentHint.name);
  }
  getVideoSource(): {
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
    notImplemented(`publisher ${this.setStyle.name}`);
  }

  /**
   * @deprecated undocumented opentok function, use https://tokbox.com/developer/sdks/js/reference/VideoElementCreatedEvent.html instead.
   */
  videoElement(): HTMLVideoElement | null {
    if (!this.id) {
      return null;
    }

    const video = document.getElementById(
      `daily-video-${this.id}`
    ) as HTMLVideoElement | null;
    return video;
  }

  videoWidth(): number | undefined {
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth
    return 300;
  }
  videoHeight(): number | undefined {
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLVideoElement/videoWidth
    return 300;
  }
}
