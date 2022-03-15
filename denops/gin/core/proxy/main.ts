import { Denops } from "../../deps.ts";
import { listen } from "./server.ts";

export function main(denops: Denops): void {
  listen(denops).catch((e) =>
    console.error(`Unexpected error occured in the proxy server: ${e}`)
  );
}
