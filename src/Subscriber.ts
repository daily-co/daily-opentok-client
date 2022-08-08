import { OTError, Event, Stream } from "@opentok/client";
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

  videoDimensionsChanged: OT.VideoDimensionsChangedEvent<Subscriber>;

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
    options: any = {},
    completionHandler: any = () => {}
  ) {
    super();
    this.element = targetElement;
    this.id = options?.id;
    this.stream = options?.stream;
  }

  getAudioVolume(): number {
    throw new Error("Method not implemented.");
  }
  getImgData(): string | null {
    throw new Error("Method not implemented.");
  }
  getStats(
    callback: (error?: OTError, stats?: OT.SubscriberStats) => void
  ): void {
    throw new Error("Method not implemented.");
  }
  getRtcStatsReport(): Promise<RTCStatsReport> {
    throw new Error("Method not implemented.");
  }
  subscribeToCaptions(value: boolean): Promise<void> {
    throw new Error("Method not implemented.");
  }
  isSubscribedToCaptions(): boolean {
    throw new Error("Method not implemented.");
  }
  isAudioBlocked(): boolean {
    throw new Error("Method not implemented.");
  }
  restrictFrameRate(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  setAudioVolume(volume: number): void {
    throw new Error("Method not implemented.");
  }
  setPreferredFrameRate(frameRate: number): void {
    throw new Error("Method not implemented.");
  }
  setPreferredResolution(resolution: OT.Dimensions): void {
    throw new Error("Method not implemented.");
  }
  subscribeToAudio(value: boolean): void {
    throw new Error("Method not implemented.");
  }
  subscribeToVideo(value: boolean): void {
    throw new Error("Method not implemented.");
  }

  setStyle<Style extends keyof OT.SubscriberStyle>(
    style: Style,
    value: OT.SubscriberStyle[Style]
  ): void {
    throw new Error("Method not implemented.");
  }

  videoHeight(): number | undefined {
    throw new Error("Method not implemented.");
  }
  videoWidth(): number | undefined {
    throw new Error("Method not implemented.");
  }
}
