import type { Denops } from "jsr:@denops/std@^7.0.0";
import { listen } from "./server.ts";

export function main(denops: Denops): void {
  listen(denops).catch((e) =>
    console.error(`Unexpected error occured in the proxy server: ${e}`)
  );
}
