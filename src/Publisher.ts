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
import Daily, { DailyParticipant } from "@daily-co/daily-js";
import { OTEventEmitter } from "./OTEventEmitter";
import {
  dailyUndefinedError,
  getParticipantTracks,
  getVideoTagID,
  notImplemented,
} from "./utils";
import { Session } from "./Session";

type StreamCreatedEvent = Event<"streamCreated", Publisher> & {
  stream: Stream;
};

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
  private _videoElement: HTMLVideoElement | null;
  constructor({
    width,
    height,
    insertMode,
    insertDefaultUI = true,
  }: PublisherProperties) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;
    this.accessAllowed = true;
    this._videoElement = null;

    if (insertDefaultUI) {
      // The UI should be fancier than this in the future
      this.element = document.createElement("div");
      this.element.id = "daily-root";
      this.id = "daily-root";
    } else {
      // Explicilty set these
      this.element = undefined;
      this.id = undefined;
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
      })
      .once("joined-meeting", () => {
        // stuff
      })
      .on("joined-meeting", (dailyEvent) => {
        if (!dailyEvent) return;

        const {
          participants: { local },
        } = dailyEvent;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (local) {
          this.updateLocalVideoDOM(local, insertDefaultUI);
        }
      })
      .on("participant-updated", (dailyEvent) => {
        // Probably needs to be in Subscriber
        if (!dailyEvent) {
          return;
        }

        const { participant } = dailyEvent;
        this.updateLocalVideoDOM(participant, insertDefaultUI);
      });

    const localParticipant = window.call.participants().local;
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    const videoOn = localParticipant?.video;
    const audioOn = localParticipant?.audio;
    /* eslint-enable */
    if (videoOn || audioOn) {
      this.updateLocalVideoDOM(localParticipant, insertDefaultUI);
    }
    if (!videoOn) {
      window.call.setLocalVideo(true);
    }
    if (!audioOn) {
      window.call.setLocalAudio(true);
    }
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
      .then(() => {
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
  videoWidth(): number | undefined {
    notImplemented(`publisher ${this.videoWidth.name}`);
  }
  videoHeight(): number | undefined {
    notImplemented(`publisher ${this.videoHeight.name}`);
  }

  /**
   * @deprecated Listen to the videoElementCreated event instead.
   */
  public videoElement(): HTMLVideoElement | null {
    return this._videoElement;
  }

  private updateLocalVideoDOM(
    participant: DailyParticipant,
    insertDefaultUI: boolean
  ) {
    const {
      session_id,
      audio: hasAudio,
      video: hasVideo,
      tracks,
      joined_at = new Date(),
      user_id,
      local,
    } = participant;
    const creationTime = joined_at.getTime();

    const settings = tracks.video.track?.getSettings() ?? {};
    const { frameRate = 0, height = 0, width = 0 } = settings;
    const { video } = getParticipantTracks(participant);

    if (!local || !video) {
      return;
    }

    const stream: Stream = {
      streamId: session_id,
      frameRate,
      hasAudio,
      hasVideo,
      // This can be set when a user calls publish() https://tokbox.com/developer/sdks/js/reference/Stream.html
      name: "",
      videoDimensions: {
        height,
        width,
      },
      videoType: "camera", // TODO(jamsea): perhaps we emit two events? One for camera and one for screen share?
      creationTime,
      connection: {
        connectionId: user_id, // TODO
        creationTime,
        // TODO(jamsea): https://tokbox.com/developer/guides/create-token/ looks like a way to add metadata
        // I think this could tie into userData(https://github.com/daily-co/pluot-core/pull/5728). If so,
        data: "",
      },
    };
    this.stream = stream;

    let videoElementCreated = false;
    if (insertDefaultUI) {
      // TODO(jamsea): do stuff
    } else {
      // Make sure this is undefined
      this.element = undefined;
    }

    if (!this._videoElement) {
      this._videoElement = document.createElement("video");
      this._videoElement.id = getVideoTagID(session_id);
      this._videoElement.style.width = this.width ?? "";
      this._videoElement.style.height = this.height ?? "";

      videoElementCreated = true;
    }

    const documentVideoElm = document.getElementById(getVideoTagID(session_id));

    if (
      !(documentVideoElm instanceof HTMLVideoElement) &&
      documentVideoElm != undefined
    ) {
      throw new Error("Video element id is invalid.");
    }

    if (
      this._videoElement.srcObject &&
      "getTracks" in this._videoElement.srcObject
    ) {
      const tracks = this._videoElement.srcObject.getTracks();
      if (tracks[0].id === video.id) {
        return;
      }
    }

    // // TODO(jamsea): handle all insert modes https://tokbox.com/developer/sdks/js/reference/OT.html#initPublisher
    // switch (this.insertMode) {
    //   case "append":
    //     if (this.element) {
    //       document.body.appendChild(this.element);
    //       this.element.appendChild(this._videoElement);
    //     }
    //     break;
    //   case "replace":
    //     notImplemented("'replace' insert mode");
    //     break;
    //   case "before":
    //     notImplemented("'before' insert mode");
    //     break;
    //   case "after":
    //     notImplemented("'after' insert mode");
    //     break;
    //   default:
    //     break;
    // }

    this._videoElement.srcObject = new MediaStream([video]);
    this._videoElement.play().catch((e) => {
      console.error(e);
    });

    const videoElementCreatedEvent: OT.Event<
      "videoElementCreated",
      Publisher
    > & {
      element: HTMLVideoElement | HTMLObjectElement;
    } = {
      type: "videoElementCreated",
      element: this._videoElement,
      target: this,
      cancelable: true,
      isDefaultPrevented: () => false,
      preventDefault: () => false,
    };

    // Only fire event if document.createElement("video") was called
    if (videoElementCreated) {
      this.ee.emit("videoElementCreated", videoElementCreatedEvent);
    }

    const streamEvent: StreamCreatedEvent = {
      type: "streamCreated",
      isDefaultPrevented: () => false,
      preventDefault: () => false,
      target: this,
      cancelable: true,
      stream: stream,
    };

    this.ee.emit("streamCreated", streamEvent);
  }
}
