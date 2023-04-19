import type { Denops } from "https://deno.land/x/denops_std@v4.1.5/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.1.5/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.1.5/buffer/mod.ts";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import {
  exec as execEdit,
  ExecOptions as ExecEditOptions,
} from "../command/edit/command.ts";

export type Candidate = { path: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    const openers = [
      "edit",
      "split",
      "vsplit",
      "tabedit",
    ];
    for (const opener of openers) {
      await define(
        denops,
        bufnr,
        `edit:local:${opener}`,
        (denops, bufnr, range) =>
          doEditLocal(denops, bufnr, range, opener, gatherCandidates),
      );
      await define(
        denops,
        bufnr,
        `edit:cached:${opener}`,
        (denops, bufnr, range) =>
          doEdit(denops, bufnr, range, opener, {}, gatherCandidates),
      );
      await define(
        denops,
        bufnr,
        `edit:HEAD:${opener}`,
        (denops, bufnr, range) =>
          doEdit(
            denops,
            bufnr,
            range,
            opener,
            { commitish: "HEAD" },
            gatherCandidates,
          ),
      );
    }
    await alias(
      denops,
      bufnr,
      "edit:local",
      "edit:local:edit",
    );
    await alias(
      denops,
      bufnr,
      "edit:cached",
      "edit:cached:edit",
    );
    await alias(
      denops,
      bufnr,
      "edit:HEAD",
      "edit:HEAD:edit",
    );
    await alias(
      denops,
      bufnr,
      "edit",
      "edit:local",
    );
  });
}

async function doEdit(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  options: ExecEditOptions,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await execEdit(denops, x.path, {
      opener,
      ...options,
    });
  }
}

async function doEditLocal(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await buffer.open(denops, x.path, {
      opener: opener,
    });
  }
}
