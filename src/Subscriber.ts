import {
  Dimensions,
  Event,
  OTError,
  Stream,
  SubscriberStats,
  SubscriberStyle,
  VideoDimensionsChangedEvent,
} from "@opentok/client";
import { notImplemented } from "./utils";
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStats(callback: (error?: OTError, stats?: SubscriberStats) => void): void {
    notImplemented();
  }
  getRtcStatsReport(): Promise<RTCStatsReport> {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToCaptions(value: boolean): Promise<void> {
    notImplemented();
  }
  isSubscribedToCaptions(): boolean {
    notImplemented();
  }
  isAudioBlocked(): boolean {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restrictFrameRate(value: boolean): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAudioVolume(volume: number): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredFrameRate(frameRate: number): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredResolution(resolution: Dimensions): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToAudio(value: boolean): void {
    notImplemented();
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToVideo(value: boolean): void {
    notImplemented();
  }

  setStyle<Style extends keyof SubscriberStyle>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    style: Style,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
