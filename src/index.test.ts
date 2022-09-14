import { describe, expect, test, beforeAll } from "@jest/globals";
import jestConfig from "../jest.config.cjs";
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
            applyConstraints: jest.fn(),
            clone: jest.fn(),
            getCapabilities: jest.fn(),
            getConstraints: jest.fn(),
            getSettings: jest.fn(),
            stop: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
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
            applyConstraints: jest.fn(),
            clone: jest.fn(),
            getCapabilities: jest.fn(),
            getConstraints: jest.fn(),
            getSettings: jest.fn(),
            stop: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          },
        ];
      },
      onaddtrack: null,
      onremovetrack: null,
      addTrack: jest.fn(),
      clone: jest.fn(),
      getTrackById: jest.fn(),
      getTracks: jest.fn(),
      removeTrack: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    });
  });
});

Object.defineProperty(global.navigator, "mediaDevices", {
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

describe("static methods", () => {
  test("OT.getUserMedia", async () => {
    // expect(OT.getUserMedia).toBeDefined();
    const result = await OT.getUserMedia();
    console.log("JEST result:", result);
    expect(result).toBeDefined();
  });
});
