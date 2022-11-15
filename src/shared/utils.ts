import DailyIframe, { DailyCall } from "@daily-co/daily-js";

export function getOrCreateCallObject(): DailyCall {
  if (window.call) return window.call;
  window.call = DailyIframe.createCallObject({
    subscribeToTracksAutomatically: false,
    dailyConfig: {
      experimentalChromeVideoMuteLightOff: true,
    },
  });
  return window.call;
}

// toCSSDimensions() converts given number or string into
// a CSS value. If the value is a number, it is converted
// to a string and a "px" suffix is added.
export function toCSSDimensions(num: number | string): string {
  if (typeof num === "string") {
    return num;
  } else if (typeof num === "number") {
    return `${num.toString()}px`;
  }
  throw new Error("Failed to convert input to pixel dimension string");
}
