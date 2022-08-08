import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import * as path from "https://deno.land/std@0.151.0/path/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.8.1/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.1/function/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import { exec as execEdit } from "../edit/command.ts";
import { INDEX, parseCommitish, WORKTREE } from "./commitish.ts";

const patternSpc = /^(?:@@|\-\-\-|\+\+\+) /;
const patternRng = /^@@ \-(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/;
const patternOld = /^\-\-\- (.*?)(?:\t.*)?$/;
const patternNew = /^\+\+\+ (.*?)(?:\t.*)?$/;

export type Jump = {
  path: string;
  lnum: number;
};

export function findJumpOld(
  index: number,
  content: string[],
): Jump | undefined {
  if (patternSpc.test(content[index])) {
    // We cannot find jump for special lines
    return undefined;
  }
  let path = "";
  let lnum = -1;
  let offset = 0;
  for (let i = index; i >= 0; i--) {
    const line = content[i];
    if (lnum === -1) {
      const m1 = line.match(patternRng);
      if (m1) {
        lnum = Number(m1[1]);
        continue;
      }
      if (!line.startsWith("+")) {
        offset += 1;
      }
    }
    const m2 = line.match(patternOld);
    if (m2) {
      path = m2[1];
      break;
    }
  }
  if (lnum === -1) {
    throw new Error(`No range pattern found in ${content}`);
  }
  if (path === "") {
    throw new Error(`No old pattern found in ${content}`);
  }
  lnum += offset - 1;
  return {
    path,
    lnum,
  };
}

export function findJumpNew(
  index: number,
  content: string[],
): Jump | undefined {
  if (patternSpc.test(content[index])) {
    // We cannot find jump for special lines
    return undefined;
  }
  let path = "";
  let lnum = -1;
  let offset = 0;
  for (let i = index; i >= 0; i--) {
    const line = content[i];
    if (lnum === -1) {
      const m1 = line.match(patternRng);
      if (m1) {
        lnum = Number(m1[2]);
        continue;
      }
      if (!line.startsWith("-")) {
        offset += 1;
      }
    }
    const m2 = line.match(patternNew);
    if (m2) {
      path = m2[1];
      break;
    }
  }
  if (lnum === -1) {
    throw new Error(`No range pattern found in ${content}`);
  }
  if (path === "") {
    throw new Error(`No new pattern found in ${content}`);
  }
  lnum += Math.max(offset - 1, 0);
  return {
    path,
    lnum,
  };
}

export async function jumpOld(denops: Denops, mods: string): Promise<void> {
  const [lnum, content, bufname] = await batch.gather(
    denops,
    async (denops) => {
      await fn.line(denops, ".");
      await fn.getline(denops, 1, "$");
      await fn.bufname(denops, "%");
    },
  ) as [number, string[], string];
  const { expr, params } = parseBufname(bufname);
  const jump = findJumpOld(lnum - 1, content);
  if (!jump) {
    // Do nothing
    return;
  }
  const filename = path.join(expr, jump.path.replace(/^a\//, ""));
  const cached = "cached" in (params ?? {});
  const commitish = unknownutil.ensureString(params?.commitish ?? "");
  const [target, _] = parseCommitish(commitish, cached);
  if (target === INDEX) {
    await execEdit(denops, filename, {
      worktree: expr,
      mods,
    });
  } else if (target === WORKTREE) {
    await buffer.open(denops, filename, {
      mods,
    });
  } else {
    await execEdit(denops, filename, {
      worktree: expr,
      commitish: commitish || "HEAD",
      mods,
    });
  }
  await fn.cursor(denops, jump.lnum, 1);
}

export async function jumpNew(denops: Denops, mods: string): Promise<void> {
  const [lnum, content, bufname] = await batch.gather(
    denops,
    async (denops) => {
      await fn.line(denops, ".");
      await fn.getline(denops, 1, "$");
      await fn.bufname(denops, "%");
    },
  ) as [number, string[], string];
  const { expr, params } = parseBufname(bufname);
  const jump = findJumpNew(lnum - 1, content);
  if (!jump) {
    // Do nothing
    return;
  }
  const filename = path.join(expr, jump.path.replace(/^b\//, ""));
  const cached = "cached" in (params ?? {});
  const commitish = unknownutil.ensureString(params?.commitish ?? "");
  const [_, target] = parseCommitish(commitish, cached);
  if (target === INDEX) {
    await execEdit(denops, filename, {
      worktree: expr,
      mods,
    });
  } else if (target === WORKTREE) {
    await buffer.open(denops, filename, {
      mods,
    });
  } else {
    await execEdit(denops, filename, {
      worktree: expr,
      commitish: commitish || "HEAD",
      mods,
    });
  }
  await fn.cursor(denops, jump.lnum, 1);
}
