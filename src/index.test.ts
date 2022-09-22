import { beforeAll, describe, expect, test, jest } from "@jest/globals";
import { FakeMediaStreamTrack } from "fake-mediastreamtrack";
import * as OT from "./index";

const mockGetUserMedia = jest.fn(async () => {
  return new Promise<MediaStream>((resolve) => {
    resolve({
      id: "DKeEJiV39EtB8hsbyCN57nuc4krQAragOQd0",
      active: true,
      getAudioTracks: () => {
        return [
          {
            contentHint: "",
            enabled: true,
            id: "b748f469-1d4a-44be-bbc4-c663c43eae0b",
            kind: "audio",
            label: "MacBook Pro Microphone (Built-in)",
            muted: false,
            onended: null,
            onmute: null,
            onunmute: null,
            readyState: "live",
            applyConstraints: (
              constraints?: MediaTrackConstraints | undefined
            ) => {
              console.debug(constraints);
              return Promise.resolve();
            },
            clone: () => {
              return {} as MediaStreamTrack;
            },
            getCapabilities: () => {
              return {} as MediaTrackCapabilities;
            },
            getConstraints: () => {
              return {} as MediaTrackConstraints;
            },
            getSettings: () => {
              return {} as MediaTrackSettings;
            },
            stop: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(() => true),
          },
        ];
      },
      getVideoTracks: () => {
        return [
          {
            contentHint: "",
            enabled: true,
            id: "34a6ae6e-6121-45ef-9cb6-518acda68538",
            kind: "video",
            label: "Cam Link 4K (0fd9:0066)",
            muted: false,
            onended: null,
            onmute: null,
            onunmute: null,
            readyState: "live",
            applyConstraints: (
              constraints?: MediaTrackConstraints | undefined
            ) => {
              console.debug(constraints);
              return Promise.resolve();
            },
            clone: () => {
              return {} as MediaStreamTrack;
            },
            getCapabilities: () => {
              return {} as MediaTrackCapabilities;
            },
            getConstraints: () => {
              return {} as MediaTrackConstraints;
            },
            getSettings: () => {
              return {} as MediaTrackSettings;
            },
            stop: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(() => true),
          },
        ];
      },
      addEventListener: jest.fn(),
      addTrack: jest.fn(),
      clone: () => {
        return {} as MediaStream;
      },
      dispatchEvent: jest.fn(() => true),
      getTrackById: () => null,
      getTracks: () => [],
      onaddtrack: null,
      onremovetrack: null,
      removeEventListener: jest.fn(),
      removeTrack: jest.fn(),
    });
  });
});

describe("static methods", () => {
  beforeAll(() => {
    Object.defineProperty(window, "MediaStreamTrack", {
      value: FakeMediaStreamTrack,
    });
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: mockGetUserMedia,
        enumerateDevices: jest.fn(),
      },
    });
  });
  test("OT.getUserMedia()", async () => {
    const result = await OT.getUserMedia();
    expect(result).toBeDefined();
    expect(result.id).toEqual("DKeEJiV39EtB8hsbyCN57nuc4krQAragOQd0");
  });
  test("OT.getUserMedia with booleans", async () => {
    const result = await OT.getUserMedia({
      videoSource: true,
      audioSource: true,
    });
    expect(result).toBeDefined();
    expect(result.id).toEqual("DKeEJiV39EtB8hsbyCN57nuc4krQAragOQd0");
  });
  test("OT.getUserMedia with strings", async () => {
    const result = await OT.getUserMedia({
      videoSource: "34a6ae6e-6121-45ef-9cb6-518acda68538",
      audioSource: "b748f469-1d4a-44be-bbc4-c663c43eae0b",
    });
    expect(result).toBeDefined();
    expect(result.id).toEqual("DKeEJiV39EtB8hsbyCN57nuc4krQAragOQd0");
  });
});
