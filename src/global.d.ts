import { DailyCall } from "@daily-co/daily-js";

declare global {
  interface Window {
    call?: DailyCall;
  }
}

export {};
