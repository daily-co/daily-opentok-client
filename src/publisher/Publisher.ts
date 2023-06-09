import { DailyCall, DailyEventObjectParticipant } from "@daily-co/daily-js";
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
import { removeParticipantMedia } from "../shared/media";
import { createStream } from "../shared/ot";
import { getOrCreateCallObject } from "../shared/utils";
import { updateMediaDOM } from "./MediaDOM";
import { getStreamCreatedEvent } from "./OTEvents";

export type InsertMode = "replace" | "after" | "before" | "append";

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
  streamId?: string;
  width?: string;
  constructor(
    { width, height, insertMode }: PublisherProperties,
    rootElementID?: string,
    completionHandler?: (error?: OTError) => void
  ) {
    super();
    this.width = width ? width.toString() : undefined;
    this.height = height ? height.toString() : undefined;
    this.insertMode = insertMode;
    this.accessAllowed = true;
    this.id = rootElementID;

    const call = getOrCreateCallObject();
    this.setupEventHandlers(call, rootElementID, completionHandler);
    this.enableMedia(call, rootElementID);
  }

  // setupEventHandlers() sets up handlers for relevant Daily events.
  private setupEventHandlers(
    call: DailyCall,
    rootElementID: string | undefined,
    completionHandler?: (error?: OTError) => void
  ) {
    const onParticipantUpdated = (dailyEvent?: DailyEventObjectParticipant) => {
      // Fire local only once.
      if (!dailyEvent?.participant.local) return;
      call.off("participant-updated", onParticipantUpdated);

      const stream = createStream(dailyEvent.participant);
      this.stream = stream;
      this.streamId = stream.streamId;
      this.ee.emit("streamCreated", getStreamCreatedEvent(this, stream));

      // Completion handler from initPublisher
      completionHandler?.();
    };

    call
      .on("started-camera", () => {
        this.accessAllowed = true;

        this.ee.emit("accessAllowed");
        console.debug(
          "startedCamera accessAllowed Count",
          this.ee.listenerCount("accessAllowed"),
          this.ee.listeners("accessAllowed")
        );
      })
      .on("camera-error", (dailyError) => {
        if (!dailyError) return;

        if (dailyError.errorMsg.errorMsg === "not allowed") {
          this.accessAllowed = false;

          const { error } = dailyError;

          const otError: OTError = {
            message: error.msg,
            name: error.type,
          };

          // Completion handler from initPublisher
          completionHandler?.(otError);
          this.ee.emit("accessDenied");
        }
      })
      .on("track-started", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }
        console.debug("publisher track started");

        const { participant } = dailyEvent;

        updateMediaDOM(participant, this, rootElementID);
      })
      .on("track-stopped", (dailyEvent) => {
        if (!dailyEvent?.participant) {
          return;
        }
        console.debug("publisher track stopped");
        const { participant } = dailyEvent;
        updateMediaDOM(participant, this, rootElementID);
      })
      .on("participant-updated", onParticipantUpdated);
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
  }

  destroy(): this {
    const call = getOrCreateCallObject();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition

    const { local } = call.participants();

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!local) {
      console.warn("No local participant found");
      return this;
    }

    removeParticipantMedia(local.session_id);

    this.ee.emit("destroyed", {
      isDefaultPrevented: () => false,
      preventDefault: () => false,
      reason: "disconnected",
      cancelable: false,
      stream: null,
    });

    this.ee.emit("streamDestroyed", {
      isDefaultPrevented: () => false,
      preventDefault: () => false,
      reason: "disconnected",
      cancelable: false,
      stream: null,
    });

    return this;
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
    const call = getOrCreateCallObject();

    call.setLocalAudio(value);
  }
  publishVideo(value: boolean): this {
    const call = getOrCreateCallObject();
    call.setLocalVideo(value);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  publishCaptions(value: boolean): void {
    errNotImplemented(this.publishCaptions.name);
  }
  cycleVideo(): Promise<{ deviceId: string }> {
    const call = getOrCreateCallObject();

    return call.cycleCamera().then(({ device }) => {
      return { deviceId: device?.deviceId ?? "" };
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
      .then(() => {
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
}
