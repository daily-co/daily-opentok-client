import {
  Dimensions,
  Event,
  OTError,
  Stream,
  SubscriberProperties,
  SubscriberStats,
  SubscriberStyle,
  VideoDimensionsChangedEvent,
} from "@opentok/client";
import { getOrCreateCallObject, notImplemented } from "../shared/utils";
import { OTEventEmitter } from "../OTEventEmitter";
import { DailyEventHandler } from "./DailyEventHandler";
import {
  DailyEventObjectParticipantLeft,
  DailyEventObjectTrack,
} from "@daily-co/daily-js";

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
  eventHandler: DailyEventHandler;

  constructor(
    rootElement: HTMLElement,
    options: { stream?: Stream; id?: string } = {},
    completionHandler: () => void = () => {
      return void 0;
    },
    properties:
      | SubscriberProperties
      | ((error?: OTError | undefined) => void)
      | undefined
  ) {
    super();

    this.element = rootElement;
    this.id = options.id;
    this.stream = options.stream;
    this.eventHandler = new DailyEventHandler(this.ee);
    const call = getOrCreateCallObject();

    call
      .on("track-started", (event?: DailyEventObjectTrack) => {
        if (!event?.participant) return;
        this.eventHandler.onTrackStarted(
          event.participant,
          rootElement,
          properties
        );
      })
      .on("participant-left", (event?: DailyEventObjectParticipantLeft) => {
        if (!event?.participant) return;
        this.eventHandler.onParticipantLeft(event.participant.session_id);
      });
    completionHandler();
  }

  getAudioVolume(): number {
    notImplemented(this.getAudioVolume.name);
  }
  getImgData(): string | null {
    notImplemented(this.getImgData.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStats(callback: (error?: OTError, stats?: SubscriberStats) => void): void {
    notImplemented(this.getStats.name);
  }
  getRtcStatsReport(): Promise<RTCStatsReport> {
    notImplemented(this.getRtcStatsReport.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToCaptions(value: boolean): Promise<void> {
    notImplemented(this.subscribeToCaptions.name);
  }
  isSubscribedToCaptions(): boolean {
    notImplemented(this.isSubscribedToCaptions.name);
  }
  isAudioBlocked(): boolean {
    notImplemented(this.isAudioBlocked.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restrictFrameRate(value: boolean): void {
    notImplemented(this.restrictFrameRate.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAudioVolume(volume: number): void {
    notImplemented(this.setAudioVolume.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredFrameRate(frameRate: number): void {
    notImplemented(this.setPreferredFrameRate.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredResolution(resolution: Dimensions): void {
    notImplemented(this.setPreferredResolution.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToAudio(value: boolean): void {
    notImplemented(this.subscribeToAudio.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToVideo(value: boolean): void {
    notImplemented(this.subscribeToVideo.name);
  }

  setStyle<Style extends keyof SubscriberStyle>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    style: Style,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: SubscriberStyle[Style]
  ): void {
    notImplemented(`subscriber ${this.setStyle.name}`);
  }

  videoHeight(): number | undefined {
    notImplemented(`subscriber ${this.videoHeight.name}`);
  }
  videoWidth(): number | undefined {
    notImplemented(`subscriber ${this.videoWidth.name}`);
  }
}
