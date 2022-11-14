import { DailyCall, DailyParticipant } from "@daily-co/daily-js";
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
import { OTEventEmitter } from "../OTEventEmitter";
import { Session } from "../session/Session";
import { errDailyUndefined, errNotImplemented } from "../shared/errors";
import { removeAllParticipantMedias } from "../shared/media";
import { createStream } from "../shared/ot";
import { getOrCreateCallObject } from "../shared/utils";
import { updateMediaDOM } from "./MediaDOM";
import { getStreamCreatedEvent } from "./OTEvents";

export type InsertMode = "replace" | "after" | "before" | "append";

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
  insertMode?: InsertMode;
  session?: Session;
  stream?: Stream;
  width?: string;

  private _videoElement: HTMLVideoElement | null;
  constructor(
    { width, height, insertMode, insertDefaultUI = true }: PublisherProperties,
    rootElementID?: string
  ) {
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

    const call = getOrCreateCallObject();
    this.setupEventHandlers(call, rootElementID);
    this.enableMedia(call, rootElementID);
  }

  // setupEventHandlers() sets up handlers for relevant Daily events.
  private setupEventHandlers(
    call: DailyCall,
    rootElementID: string | undefined
  ) {
    call
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
      .on("track-started", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }
        console.debug("publisher track started");

        const { participant } = dailyEvent;
        updateMediaDOM(participant, this, rootElementID);
        const stream = createStream(participant);
        this.ee.emit("streamCreated", getStreamCreatedEvent(this, stream));
      })
      .on("track-stopped", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }
        console.debug("publisher track stopped");
        const { participant } = dailyEvent;
        updateMediaDOM(participant, this, rootElementID);
      })
      .on("left-meeting", () => {
        removeAllParticipantMedias();
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

  // enableMedia() turns on the user's camera and microphone if they
  // are not already enabled.
  private enableMedia(call: DailyCall, rootElementID: string | undefined) {
    const localParticipant = call.participants().local;
    let videoOn = false;
    let audioOn = false;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (localParticipant) {
      videoOn = localParticipant.video;
      audioOn = localParticipant.audio;
    }

    if (videoOn || audioOn) {
      updateMediaDOM(localParticipant, this, rootElementID);
    }
    if (!videoOn) {
      call.setLocalVideo(true);
    }
    if (!audioOn) {
      call.setLocalAudio(true);
    }
  }

  destroy(): void {
    if (!window.call) {
      errDailyUndefined();
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
    errNotImplemented(this.getImgData.name);
  }
  getStats(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    callback: (error?: OTError, stats?: PublisherStatsArr) => void
  ): void {
    errNotImplemented(this.getStats.name);
  }
  getRtcStatsReport(): Promise<PublisherRtcStatsReportArr> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.getRtcStatsReport.name));
    });
  }
  getStyle(): PublisherProperties {
    errNotImplemented(this.getStyle.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyVideoFilter(videoFilter: VideoFilter): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.applyVideoFilter.name));
    });
  }
  getVideoFilter(): VideoFilter | null {
    errNotImplemented(this.getVideoFilter.name);
  }
  clearVideoFilter(): Promise<void> {
    return new Promise((resolve, reject) => {
      reject(errNotImplemented(this.clearVideoFilter.name));
    });
  }
  publishAudio(value: boolean): void {
    if (!window.call) {
      errDailyUndefined();
    }
    window.call.setLocalAudio(value);
  }
  publishVideo(value: boolean): this {
    if (!window.call) {
      errDailyUndefined();
    }
    window.call.setLocalVideo(value);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishCaptions(value: boolean): void {
    errNotImplemented(this.publishCaptions.name);
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    if (!window.call) {
      errDailyUndefined();
    }

    return window.call.cycleCamera().then((device) => {
      return { deviceId: String(device) };
    });
  }
  setAudioSource(audioSource: string | MediaStreamTrack): Promise<undefined> {
    if (!window.call) {
      errDailyUndefined();
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
      errDailyUndefined();
    }
    const { local: { tracks: { audio: { persistentTrack } = {} } = {} } = {} } =
      window.call.participants();

    return persistentTrack ?? null;
  }
  setVideoSource(videoSourceId: string): Promise<undefined> {
    if (!window.call) {
      errDailyUndefined();
    }

    return window.call
      .setInputDevicesAsync({
        videoDeviceId: videoSourceId,
      })
      .then((res) => {
        console.log("setVideoSource: ", res);
        return undefined;
      });
  }
  getVideoContentHint(): VideoContentHint {
    errNotImplemented(this.getVideoContentHint.name);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setVideoContentHint(hint: VideoContentHint): void {
    errNotImplemented(this.setVideoContentHint.name);
  }
  getVideoSource(): {
    deviceId: string | null;
    type: "camera" | "screen" | "custom" | null;
    track: MediaStreamTrack | null;
  } {
    if (!window.call) {
      errDailyUndefined();
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
    errNotImplemented(`publisher ${this.setStyle.name}`);
  }
  videoWidth(): number | undefined {
    errNotImplemented(`publisher ${this.videoWidth.name}`);
  }
  videoHeight(): number | undefined {
    errNotImplemented(`publisher ${this.videoHeight.name}`);
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
