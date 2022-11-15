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
import { getOrCreateCallObject } from "../shared/utils";
import { OTEventEmitter } from "../OTEventEmitter";
import { DailyEventHandler } from "./DailyEventHandler";
import {
  DailyEventObjectParticipantLeft,
  DailyEventObjectTrack,
} from "@daily-co/daily-js";
import { errNotImplemented } from "../shared/errors";

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
    errNotImplemented(this.getAudioVolume.name);
  }
  getImgData(): string | null {
    errNotImplemented(this.getImgData.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getStats(callback: (error?: OTError, stats?: SubscriberStats) => void): void {
    errNotImplemented(this.getStats.name);
  }
  getRtcStatsReport(): Promise<RTCStatsReport> {
    errNotImplemented(this.getRtcStatsReport.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToCaptions(value: boolean): Promise<void> {
    errNotImplemented(this.subscribeToCaptions.name);
  }
  isSubscribedToCaptions(): boolean {
    errNotImplemented(this.isSubscribedToCaptions.name);
  }
  isAudioBlocked(): boolean {
    errNotImplemented(this.isAudioBlocked.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  restrictFrameRate(value: boolean): void {
    errNotImplemented(this.restrictFrameRate.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setAudioVolume(volume: number): void {
    errNotImplemented(this.setAudioVolume.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredFrameRate(frameRate: number): void {
    errNotImplemented(this.setPreferredFrameRate.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setPreferredResolution(resolution: Dimensions): void {
    errNotImplemented(this.setPreferredResolution.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToAudio(value: boolean): void {
    errNotImplemented(this.subscribeToAudio.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscribeToVideo(value: boolean): void {
    errNotImplemented(this.subscribeToVideo.name);
  }

  setStyle<Style extends keyof SubscriberStyle>(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    style: Style,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: SubscriberStyle[Style]
  ): void {
    errNotImplemented(`subscriber ${this.setStyle.name}`);
  }

  videoHeight(): number | undefined {
    errNotImplemented(`subscriber ${this.videoHeight.name}`);
  }
  videoWidth(): number | undefined {
    errNotImplemented(`subscriber ${this.videoWidth.name}`);
  }
}
