import {
  Event,
  OTError,
  PublisherRtcStatsReportArr,
  PublisherStatsArr,
  PublisherStyle,
  Stream,
  VideoContentHint,
  VideoDimensionsChangedEvent,
  VideoFilter,
} from "@opentok/client";
import { OTEventEmitter } from "./OTEventEmitter";

type PublisherProperties = OT.PublisherProperties & { dailyElementId?: string };

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
  dailyElementId?: string;
  accessAllowed: boolean;
  width?: string;
  height?: string;
  insertMode?: "replace" | "after" | "before" | "append";
  constructor({
    width,
    height,
    insertMode,
    dailyElementId,
  }: PublisherProperties) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;

    this.dailyElementId = dailyElementId;
    this.accessAllowed = true;
  }

  destroy(): void {
    throw new Error("Method not implemented.");
  }
  getImgData(): string | null {
    throw new Error("Method not implemented.");
  }
  getStats(
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {
    throw new Error("Method not implemented.");
  }
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getStyle(): PublisherProperties {
    throw new Error("Not implemented");
  }
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getVideoFilter(): VideoFilter | null {
    throw new Error("Method not implemented.");
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  publishAudio(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  publishVideo(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  publishCaptions(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    return new Promise((resolve, reject) => {
      throw new Error("Method not implemented.");
    });
  }
  getAudioSource(): MediaStreamTrack {
    throw new Error("Method not implemented.");
  }
  setVideoSource(videoSourceId: string): Promise<undefined> {
    return new Promise((resolve, reject) => {
      reject(new Error("Not implemented"));
    });
  }
  getVideoContentHint(): VideoContentHint {
    throw new Error("Method not implemented.");
  }
  setVideoContentHint(hint: VideoContentHint): void {
    throw new Error("Method not implemented.");
  }
  getVideoSource(): {
    deviceId: string | null;
    type: string | null;
    track: MediaStreamTrack | null;
  } {
    throw new Error("Method not implemented.");
  }
  setStyle<Style extends keyof PublisherStyle>(
    style: Style,
    value: PublisherStyle[Style]
  ): void {
    throw new Error("Method not implemented.");
  }
  videoWidth(): number | undefined {
    throw new Error("Method not implemented.");
  }
  videoHeight(): number | undefined {
    throw new Error("Method not implemented.");
  }
}
