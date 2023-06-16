import { removeAnsiEscapeCode } from "./ansi_escape_code.ts";

export type Indicator = {
  open(id: string): void | PromiseLike<void>;
  write(id: string, content: string[]): void | PromiseLike<void>;
  close(id: string): void | PromiseLike<void>;
};

export type IndicatorStreamOptions = {
  encoding?: string;
};

/**
 * IndicatorStream writes chunks to the specified indicator
 */
export class IndicatorStream extends TransformStream<Uint8Array, Uint8Array> {
  constructor(
    indicator: Indicator,
    options: IndicatorStreamOptions = {},
  ) {
    const { encoding = "utf-8" } = options;
    const id = crypto.randomUUID();
    const decoder = new TextDecoder(encoding);
    super({
      start() {
        return indicator.open(id);
      },
      async transform(chunk, controller) {
        const text = removeAnsiEscapeCode(decoder.decode(chunk));
        await indicator.write(id, text.split("\n"));
        controller.enqueue(chunk);
      },
      flush() {
        return indicator.close(id);
      },
    });
  }
}
