let debug = false;

export function get(): boolean {
  return debug;
}

export function set(value: boolean): void {
  debug = value;
}

export function report(message: string): void {
  if (debug) {
    console.debug(`[DEBUG] ${message}`);
  }
}
