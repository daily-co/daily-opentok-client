export function errNotImplemented(name = "unknown"): never {
    throw new Error(`Function or operation not implemented: ${name}`);
  }
  
  export function errDailyUndefined(): never {
    throw new Error("Daily call object not initialized.");
  }
  