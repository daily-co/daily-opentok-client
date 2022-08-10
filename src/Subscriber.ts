/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Dimensions,
  Event,
  OTError,
  Stream,
  SubscriberStats,
  SubscriberStyle,
  VideoDimensionsChangedEvent,
} from "@opentok/client";
import { notImplemented } from ".";
import { OTEventEmitter } from "./OTEventEmitter";

export class Subscriber extends OTEventEmitter<{
  audioLevelUpdated: Event<"audioLevelUpdated", Subscriber> & {
    audioLevel: number;
  };

  connected: Event<"connected", Subscriber>;

  captionReceived: Event<"captionReceived", Subscriber> & {
    streamId: string;
    caption: string;
  };

  destroyed: Event<"destroyed", Subscriber> & {
    reason: string;
  };

  encryptionSecretMismatch: Event<"encryptionSecretMismatch", Subscriber>;

  encryptionSecretMatch: Event<"encryptionSecretMatch", Subscriber>;

  videoDimensionsChanged: VideoDimensionsChangedEvent<Subscriber>;

  videoDisabled: Event<"videoDisabled", Subscriber> & {
    reason: string;
  };

  videoDisableWarning: Event<"videoDisableWarning", Subscriber>;
  videoDisableWarningLifted: Event<"videoDisableWarningLifted", Subscriber>;

  videoElementCreated: Event<"videoElementCreated", Subscriber> & {
    element: HTMLVideoElement | HTMLObjectElement;
  };

  videoEnabled: Event<"videoEnabled", Subscriber> & {
    reason: string;
  };
}> {
  element?: HTMLElement;
  id?: string;
  stream?: Stream;

  constructor(
    targetElement: HTMLElement,
    options: { stream?: Stream; id?: string } = {},
    completionHandler: () => void = () => {
      return void 0;
    }
  ) {
    super();

    this.element = targetElement;
    this.id = options.id;
    this.stream = options.stream;
    completionHandler();
  }

  getAudioVolume(): number {
    notImplemented();
  }
  getImgData(): string | null {
    notImplemented();
  }
  getStats(callback: (error?: OTError, stats?: SubscriberStats) => void): void {
    notImplemented();
  }
  getRtcStatsReport(): Promise<RTCStatsReport> {
    notImplemented();
  }
  subscribeToCaptions(value: boolean): Promise<void> {
    notImplemented();
  }
  isSubscribedToCaptions(): boolean {
    notImplemented();
  }
  isAudioBlocked(): boolean {
    notImplemented();
  }
  restrictFrameRate(value: boolean): void {
    notImplemented();
  }
  setAudioVolume(volume: number): void {
    notImplemented();
  }
  setPreferredFrameRate(frameRate: number): void {
    notImplemented();
  }
  setPreferredResolution(resolution: Dimensions): void {
    notImplemented();
  }
  subscribeToAudio(value: boolean): void {
    notImplemented();
  }
  subscribeToVideo(value: boolean): void {
    notImplemented();
  }

  setStyle<Style extends keyof SubscriberStyle>(
    style: Style,
    value: SubscriberStyle[Style]
  ): void {
    notImplemented();
  }

  videoHeight(): number | undefined {
    notImplemented();
  }
  videoWidth(): number | undefined {
    notImplemented();
  }
}
