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
import { OTEventEmitter } from "./OTEventEmitter";
import { notImplemented } from "./utils";

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
  width?: string;
  height?: string;
  insertMode?: "replace" | "after" | "before" | "append";
  constructor({ width, height, insertMode }: PublisherProperties) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;

    this.accessAllowed = true;
  }

  destroy(): void {
    notImplemented();
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
      reject(new Error("Method not implemented."));
    });
  }
  getStyle(): PublisherProperties {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Method not implemented."));
    });
  }
  getVideoFilter(): VideoFilter | null {
    notImplemented();
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Method not implemented."));
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishAudio(value: boolean): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishVideo(value: boolean): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishCaptions(value: boolean): void {
    notImplemented();
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  getAudioSource(): MediaStreamTrack {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoSource(videoSourceId: string): Promise<undefined> {
    return new Promise((_, reject) => {
      reject(notImplemented());
    });
  }
  getVideoContentHint(): VideoContentHint {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoContentHint(hint: VideoContentHint): void {
    notImplemented();
  }
  getVideoSource(): {
    deviceId: string | null;
    type: string | null;
    track: MediaStreamTrack | null;
  } {
    notImplemented();
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
