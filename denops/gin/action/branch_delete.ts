import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { define, GatherCandidates, Range } from "./core.ts";

export type Candidate =
  | { kind: "remote"; branch: string; remote: string }
  | { kind?: "alias" | "local"; branch: string; worktree?: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "delete",
      (denops, bufnr, range) =>
        doDelete(denops, bufnr, range, false, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "delete:force",
      (denops, bufnr, range) =>
        doDelete(denops, bufnr, range, true, gatherCandidates),
    );
  });
}

async function doDelete(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    switch (x.kind) {
      case "alias":
        continue;
      case "remote":
        await denops.dispatch("gin", "command", "", [
          "push",
          "--delete",
          x.remote,
          x.branch,
        ]);
        break;
      default:
        if (x.worktree) {
          // The branch is checked out in another worktree, so the worktree
          // must be removed first before the branch itself can be deleted.
          await denops.dispatch("gin", "command", "", [
            "worktree",
            "remove",
            ...(force ? ["--force"] : []),
            x.worktree,
          ]);
        }
        await denops.dispatch("gin", "command", "", [
          "branch",
          force ? "-D" : "-d",
          x.branch,
        ]);
        break;
    }
  }
}
