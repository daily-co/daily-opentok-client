import {
  AudioOutputDevice,
  GetUserMediaProperties,
  OTError,
  ScreenSharingCapabilityResponse,
} from "@opentok/client";
import Daily from "@daily-co/daily-js";
import { initSession } from "./session/Init";
import { initPublisher } from "./publisher/Init";
import { getOrCreateCallObject } from "./shared/utils";
import { errDailyUndefined } from "./shared/errors";

function checkScreenSharingCapability(
  callback: (response: ScreenSharingCapabilityResponse) => void
): void {
  return Daily.supportedBrowser().supportsScreenShare
    ? callback({
        supported: true,
        extensionRegistered: false,
        supportedSources: {
          screen: true,
          window: true,
        },
      })
    : callback({
        supported: false,
        extensionRegistered: false,
        supportedSources: {
          screen: false,
          window: false,
        },
      });
}

function checkSystemRequirements(): number {
  return Daily.supportedBrowser().supported ? 1 : 0;
}

function getActiveAudioOutputDevice(): Promise<AudioOutputDevice> {
  if (!window.call) {
    errDailyUndefined();
  }

  return window.call.enumerateDevices().then(({ devices }) => {
    const device = devices.find((device) => device.kind === "audiooutput");

    if (!device) {
      throw new Error("No audio output device found.");
    }

    const { deviceId, label } = device;

    return {
      deviceId,
      label,
    };
  });
}

function upgradeSystemRequirements() {
  // Left empty
  console.debug("upgradeSystemRequirements called");
}

function getDevices(
  callback: (error: OTError | undefined, devices?: OT.Device[]) => void
): void {
  const call = getOrCreateCallObject();

  call
    .enumerateDevices()
    .then(({ devices }) => {
      const OTDevices: OT.Device[] = devices
        .filter((device) => /^(audio|video)input$/.test(device.kind))
        .map((device) => {
          device.kind;
          return {
            deviceId: device.deviceId,
            kind: device.kind.includes("audio") ? "audioInput" : "videoInput",
            label: device.label,
          };
        });

      callback(undefined, OTDevices);
    })
    .catch((err: Error) => {
      console.error("enumerateDevices error", err);
      callback(err);
    });
}

function getSupportedCodecs(): Promise<{
  videoEncoders: ("H264" | "VP8")[];
  videoDecoders: ("H264" | "VP8")[];
}> {
  return Daily.supportedBrowser().supported
    ? Promise.resolve({
        videoDecoders: ["H264", "VP8"],
        videoEncoders: ["H264", "VP8"],
      })
    : Promise.resolve({ videoDecoders: [], videoEncoders: [] });
}

function getUserMedia(
  properties?: GetUserMediaProperties
): Promise<MediaStream> {
  if (!properties) {
    return navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
  }
  const {
    audioSource,
    videoSource,
    autoGainControl,
    echoCancellation,
    facingMode,
    frameRate,
    noiseSuppression,
    resolution = "",
  } = properties;

  let video: boolean | MediaTrackConstraints | undefined = undefined;

  if (typeof videoSource === "boolean") {
    video = videoSource;
  } else if (videoSource instanceof window.MediaStreamTrack) {
    const [width, height] = resolution.split("x");

    video = {
      width: width ? Number(width) : undefined,
      height: height ? Number(height) : undefined,
      frameRate: frameRate
        ? {
            ideal: frameRate,
          }
        : undefined,
      facingMode,
    };
  } else if (typeof videoSource === "string") {
    video = { deviceId: videoSource };
  }

  let audio: boolean | MediaTrackConstraints | undefined = undefined;

  if (typeof audioSource === "boolean") {
    audio = audioSource;
  } else if (audioSource instanceof MediaStreamTrack) {
    audio = {
      noiseSuppression,
      echoCancellation,
      autoGainControl,
    };
  } else if (typeof audioSource === "string") {
    audio = { deviceId: audioSource };
  }

  return navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });
}

function hasMediaProcessorSupport(): boolean {
  return Daily.supportedBrowser().supportsVideoProcessing;
}

function setAudioOutputDevice(deviceId: string): Promise<void> {
  if (!window.call) {
    errDailyUndefined();
  }
  return window.call
    .setOutputDeviceAsync({
      outputDeviceId: deviceId,
    })
    .then(() => {
      // return void to match OpenTok's API
      return;
    });
}

let OTlogLevel = 0;
function setLogLevel(logLevel: number): void {
  OTlogLevel = logLevel;
}

function log(message: string): void {
  if (OTlogLevel >= 4) {
    console.debug(message);
  }
}

function registerScreenSharingExtension(
  kind: string,
  id: string,
  version: number
) {
  console.debug("registerScreenSharingExtension: ", kind, id, version);
  return;
}

const OT = {
  checkScreenSharingCapability,
  checkSystemRequirements,
  getActiveAudioOutputDevice,
  getDevices,
  getSupportedCodecs,
  getUserMedia,
  hasMediaProcessorSupport,
  initPublisher,
  initSession,
  log,
  registerScreenSharingExtension,
  setAudioOutputDevice,
  setLogLevel,
  upgradeSystemRequirements,
  properties: {
    /**
     * @deprecated added to support projects that use older versions of OpenTok
     */
    loggingURL: "https://hlg.tokbox.com/prod", // 'https://hlg.tokbox.com/prod/logging/ClientEvent'
  },
};

export { OT };
