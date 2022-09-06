import { Event } from "@opentok/client";
import { EventEmitter } from "events";

export class OTEventEmitter<EventMap> {
  ee: EventEmitter;
  constructor() {
    this.ee = new EventEmitter();
    this.on("newListener", (eventName) => {
      this.ee.emit(`${eventName.type}:added`);
    });
    this.on("removeListener", (eventName) => {
      this.ee.emit(`${eventName.type}:removed`);
    });
  }
  on<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: (event: EventMap[EventName]) => void,
    // defines the <code>this</code> in the handler method
    context?: object
  ): void;

  on(
    eventName: string,
    callback: (event: Event<string, unknown>) => void,
    context?: object
  ): void;

  on(eventMap: object, context?: object): void;

  on(
    eventName: string | object,
    callback: object | ((event: Event<string, unknown>) => void),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: object
  ): void {
    if (typeof eventName === "string" && typeof callback !== "object") {
      this.ee.on(eventName, callback);
    }
  }

  once<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: (event: EventMap[EventName]) => void,
    context?: object
  ): void;

  once(
    eventName: string,
    callback: (event: Event<string, unknown>) => void,
    context?: object
  ): void;

  once(eventMap: object, context?: object): void;

  once(
    eventName: string | object,
    callback: object | ((event: Event<string, unknown>) => void),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: object
  ): void {
    if (typeof eventName === "string" && typeof callback !== "object") {
      this.ee.once(eventName, callback);
    }
  }

  off<EventName extends keyof EventMap>(
    eventName?: EventName,
    callback?: (event: EventMap[EventName]) => void,
    context?: object
  ): void;

  off(
    eventName?: string,
    callback?: (event: Event<string, unknown>) => void,
    context?: object
  ): void;

  off(eventMap: object, context?: object): void;

  off(
    eventName: string | object | undefined,
    callback?: object | ((event: Event<string, unknown>) => void),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context?: object
  ): void {
    if (
      typeof eventName === "string" &&
      callback &&
      typeof callback !== "object"
    ) {
      this.ee.off(eventName, callback);
    }
  }
}
