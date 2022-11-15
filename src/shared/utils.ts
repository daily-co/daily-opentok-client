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

export function toPixelDimensions(num: number | string): string {
  if (typeof num === "string") {
    return num;
  } else if (typeof num === "number") {
    return `${num.toString()}px`;
  }
  throw new Error("Failed to convert input to pixel dimension string");
}