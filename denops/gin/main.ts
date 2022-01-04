import { Denops } from "./deps.ts";

import { main as mainAction } from "./core/action/main.ts";
import { main as mainReload } from "./core/reload/main.ts";

import { main as mainDiff } from "./feature/diff/main.ts";
import { main as mainNative } from "./feature/native/main.ts";
import { main as mainShow } from "./feature/show/main.ts";
import { main as mainStatus } from "./feature/status/main.ts";

export function main(denops: Denops): void {
  mainAction(denops);
  mainReload(denops);

  mainDiff(denops);
  mainNative(denops);
  mainShow(denops);
  mainStatus(denops);
}
