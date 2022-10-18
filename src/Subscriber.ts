import {
  Dimensions,
  Event,
  OTError,
  Stream,
  SubscriberStats,
  SubscriberStyle,
  VideoDimensionsChangedEvent,
} from "@opentok/client";
import { dailyUndefinedError, notImplemented } from "./utils";
import { OTEventEmitter } from "./OTEventEmitter";
import { DailyParticipantUpdateOptions } from "@daily-co/daily-js";

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
  subscribeToAudio(value: boolean): this {
    if (!window.call) {
      dailyUndefinedError();
    }
    const participants = window.call.participants();

    window.call
      .setNetworkTopology({ topology: "sfu" })
      .catch(console.error)
      .finally(() => {
        const updateList: Record<string, DailyParticipantUpdateOptions> = {};
        for (const id in participants) {
          if (id === "local") {
            continue;
          }
          updateList[id] = {
            setSubscribedTracks: {
              audio: value,
            },
          };
        }
        window.call?.updateParticipants(updateList);
      });

    return this;
  }
  subscribeToVideo(value: boolean): this {
    if (!window.call) {
      dailyUndefinedError();
    }
    const participants = window.call.participants();

    window.call
      .setNetworkTopology({ topology: "sfu" })
      .catch(console.error)
      .finally(() => {
        const updateList: Record<string, DailyParticipantUpdateOptions> = {};
        for (const id in participants) {
          if (id === "local") {
            continue;
          }
          updateList[id] = {
            setSubscribedTracks: {
              video: value,
            },
          };
        }
        window.call?.updateParticipants(updateList);
      });

    return this;
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
