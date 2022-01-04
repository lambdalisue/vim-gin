import { Denops } from "./deps.ts";

import { main as mainAction } from "./core/action/main.ts";
import { main as mainBare } from "./core/bare/main.ts";
import { main as mainReload } from "./core/reload/main.ts";

import { main as mainDiff } from "./feat/diff/main.ts";
import { main as mainShow } from "./feat/show/main.ts";
import { main as mainStatus } from "./feat/status/main.ts";

export function main(denops: Denops): void {
  mainAction(denops);
  mainBare(denops);
  mainReload(denops);

  mainDiff(denops);
  mainShow(denops);
  mainStatus(denops);
}
