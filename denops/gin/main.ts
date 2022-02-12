import { Denops } from "./deps.ts";

import { main as mainAction } from "./core/action/main.ts";
import { main as mainBare } from "./core/bare/main.ts";
import { main as mainDebug } from "./core/debug/main.ts";
import { main as mainUtil } from "./core/util/main.ts";

import { main as mainDiff } from "./feat/diff/main.ts";
import { main as mainDiscard } from "./feat/discard/main.ts";
import { main as mainEdit } from "./feat/edit/main.ts";
import { main as mainPatch } from "./feat/patch/main.ts";
import { main as mainStatus } from "./feat/status/main.ts";

export function main(denops: Denops): void {
  mainAction(denops);
  mainBare(denops);
  mainDebug(denops);
  mainUtil(denops);

  mainDiff(denops);
  mainDiscard(denops);
  mainEdit(denops);
  mainPatch(denops);
  mainStatus(denops);
}
