import { DailyCall } from "@daily-co/daily-js";
import OT from "./index";

declare global {
  interface Window {
    call?: DailyCall;
  }
}

export {};
