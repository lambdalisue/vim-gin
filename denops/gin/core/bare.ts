import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.7.1/autocmd/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.7.1/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.7.1/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.7.1/option/mod.ts";
import { expand } from "../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../util/worktree.ts";
import { run } from "../git/process.ts";

export type Options = {
  worktree?: string;
};

export type Result = {
  status: Deno.ProcessStatus;
  stdout: Uint8Array;
  stderr: Uint8Array;
};

export async function exec(
  denops: Denops,
  args: string[],
  options: Options = {},
): Promise<Result> {
  const [env, verbose, eventignore] = await batch.gather(
    denops,
    async (denops) => {
      await fn.environ(denops);
      await option.verbose.get(denops);
      await option.eventignore.get(denops);
    },
  ) as [Record<string, string>, number, string];

  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );
  const proc = run(args, {
    printCommand: !!verbose,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    noOptionalLocks: true,
    cwd: worktree,
    env,
  });
  const [status, stdout, stderr] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();
  if (status.success && !eventignore.includes("all")) {
    await autocmd.emit(denops, "User", "GinCommandPost", {
      nomodeline: true,
    });
  }
  return { status, stdout, stderr };
}

export async function bind(denops: Denops, bufnr: number): Promise<void> {
  await autocmd.group(denops, `gin_bare_command_bind_${bufnr}`, (helper) => {
    helper.remove();
    helper.define(
      "User",
      "GinCommandPost",
      `call gin#util#reload(${bufnr})`,
    );
  });
}
