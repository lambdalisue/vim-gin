import type { Denops } from "jsr:@denops/std@^7.0.0";

import { main as mainBare } from "./command/bare/main.ts";
import { main as mainBuffer } from "./command/buffer/main.ts";
import { main as mainProxy } from "./proxy/main.ts";
import { main as mainUtil } from "./util/main.ts";

import { main as mainBlame } from "./command/blame/main.ts";
import { main as mainBranch } from "./command/branch/main.ts";
import { main as mainBrowse } from "./command/browse/main.ts";
import { main as mainChaperon } from "./command/chaperon/main.ts";
import { main as mainDiff } from "./command/diff/main.ts";
import { main as mainEdit } from "./command/edit/main.ts";
import { main as mainLog } from "./command/log/main.ts";
import { main as mainPatch } from "./command/patch/main.ts";
import { main as mainStatus } from "./command/status/main.ts";

import { main as mainComponentBranch } from "./component/branch.ts";
import { main as mainComponentTraffic } from "./component/traffic.ts";
import { main as mainComponentWorktree } from "./component/worktree.ts";

export function main(denops: Denops): void {
  mainBare(denops);
  mainBuffer(denops);
  mainProxy(denops);
  mainUtil(denops);

  mainBlame(denops);
  mainBranch(denops);
  mainBrowse(denops);
  mainChaperon(denops);
  mainDiff(denops);
  mainEdit(denops);
  mainLog(denops);
  mainPatch(denops);
  mainStatus(denops);

  mainComponentBranch(denops);
  mainComponentTraffic(denops);
  mainComponentWorktree(denops);
}
