import { Event } from "@opentok/client";
import { EventEmitter } from "events";

interface EventEmitterOptions {
  /**
   * Enables automatic capturing of promise rejection.
   */
  captureRejections?: boolean | undefined;
}

export class OTEventEmitter<EventMap> {
  ee: EventEmitter;
  constructor(options?: EventEmitterOptions | undefined) {
    this.ee = new EventEmitter(options);
  }
  on<EventName extends keyof EventMap>(
    eventName: EventName,
    callback: (event: EventMap[EventName]) => void,
    context?: object
  ): void;

  on(
    eventName: string,
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void;

  on(eventName: string | object, callback: any, context?: object): void {
    if (typeof eventName === "string") {
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
    callback: (event: Event<string, any>) => void,
    context?: object
  ): void;

  once(eventMap: object, context?: object): void;

  once(eventName: any, callback: any, context?: any): void {
    if (typeof eventName !== "string") {
      throw new Error("eventName must be a string");
    }
    if (typeof callback !== "function") {
      throw new Error("callback must be a function");
    }
    this.ee.once(eventName, callback);
  }

  off<EventName extends keyof EventMap>(
    eventName?: EventName,
    callback?: (event: EventMap[EventName]) => void,
    context?: object
  ): void;

  off(
    eventName?: string,
    callback?: (event: Event<string, any>) => void,
    context?: object
  ): void;

  off(eventMap: object, context?: object): void;

  off(eventName: any, callback: any, context?: any): void {
    if (typeof eventName !== "string") {
      throw new Error("eventName must be a string");
    }
    if (typeof callback !== "function") {
      throw new Error("callback must be a function");
    }
    this.ee.off(eventName, callback);
  }
}
