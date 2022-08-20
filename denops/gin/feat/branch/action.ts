import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.1/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.8.1/batch/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.8.1/helper/mod.ts";
import { define, Range } from "../../core/action/action.ts";
import { command as commandBare } from "../../core/bare/command.ts";
import { Branch, parse as parseBranch } from "./parser.ts";

export async function init(denops: Denops, bufnr: number): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(denops, bufnr, "echo", doEcho);
    await define(denops, bufnr, "switch", doSwitch);
    await define(
      denops,
      bufnr,
      "new",
      (denops, bufnr, range) => doNew(denops, bufnr, range, false),
    );
    await define(
      denops,
      bufnr,
      "new:force",
      (denops, bufnr, range) => doNew(denops, bufnr, range, true),
    );
    await define(denops, bufnr, "new:orphan", doNewOrphan);
    await define(
      denops,
      bufnr,
      "move",
      (denops, bufnr, range) => doMove(denops, bufnr, range, false),
    );
    await define(
      denops,
      bufnr,
      "move:force",
      (denops, bufnr, range) => doMove(denops, bufnr, range, true),
    );
    await define(
      denops,
      bufnr,
      "delete",
      (denops, bufnr, range) => doDelete(denops, bufnr, range, false),
    );
    await define(
      denops,
      bufnr,
      "delete:force",
      (denops, bufnr, range) => doDelete(denops, bufnr, range, true),
    );
    await define(
      denops,
      bufnr,
      "merge:ff",
      (denops, bufnr, range) => doMerge(denops, bufnr, range, "ff"),
    );
    await define(
      denops,
      bufnr,
      "merge:no-ff",
      (denops, bufnr, range) => doMerge(denops, bufnr, range, "no-ff"),
    );
    await define(
      denops,
      bufnr,
      "merge:ff-only",
      (denops, bufnr, range) => doMerge(denops, bufnr, range, "ff-only"),
    );
    await define(denops, bufnr, "rebase", doRebase);
    await define(denops, bufnr, "rebase:i", doRebaseInteractive);
  });
}

async function doEcho(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await helper.echo(denops, JSON.stringify(xs, null, 2));
}

async function doSwitch(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const x = (await gatherCandidates(denops, bufnr, range))[0];
  await commandBare(denops, ["switch", x.branch]);
}

async function doNew(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
): Promise<void> {
  const x = (await gatherCandidates(denops, bufnr, range))[0];
  const from = x.branch;
  const name = await helper.input(denops, {
    prompt: `New branch (from ${from}): `,
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await commandBare(denops, [
    "switch",
    force ? "-C" : "-c",
    name,
    from,
  ]);
}

async function doNewOrphan(
  denops: Denops,
  _bufnr: number,
  _range: Range,
): Promise<void> {
  const name = await helper.input(denops, {
    prompt: "New branch (orphan): ",
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await commandBare(denops, ["switch", "--orphan", name]);
}

async function doMove(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
): Promise<void> {
  const x = (await gatherCandidates(denops, bufnr, range))[0];
  const from = x.branch;
  const name = await helper.input(denops, {
    prompt: `Rename (from ${from}): `,
    text: from,
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await commandBare(denops, [
    "branch",
    ...(force ? ["--force"] : []),
    "--move",
    from,
    name,
  ]);
}

async function doDelete(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    switch (x.kind) {
      case "alias":
        continue;
      case "local":
        await commandBare(denops, [
          "branch",
          force ? "-D" : "-d",
          x.branch,
        ]);
        break;
      case "remote":
        await commandBare(denops, [
          "push",
          "--delete",
          x.remote,
          x.branch,
        ]);
        break;
    }
  }
}

async function doMerge(
  denops: Denops,
  bufnr: number,
  range: Range,
  method: "ff" | "no-ff" | "ff-only",
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    if (x.kind === "alias") {
      continue;
    }
    await commandBare(denops, [
      "merge",
      `--${method}`,
      x.target,
    ]);
  }
}

async function doRebase(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    if (x.kind === "alias") {
      continue;
    }
    await commandBare(denops, [
      "rebase",
      x.target,
    ]);
  }
}

async function doRebaseInteractive(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const x = (await gatherCandidates(denops, bufnr, range))[0];
  if (x.kind === "alias") {
    return;
  }
  // NOTE:
  // We must NOT await the command otherwise Vim would freeze
  // because command proxy could not work if we await here.
  commandBare(denops, [
    "rebase",
    "--interactive",
    x.target,
  ]).catch(async (e) => {
    await helper.echoerr(denops, e.toString());
  });
}

async function gatherCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Branch[]> {
  const content = await fn.getbufline(
    denops,
    bufnr,
    Math.max(start, 1),
    Math.max(end, 1),
  );
  const result = parseBranch(content);
  return result.branches;
}
