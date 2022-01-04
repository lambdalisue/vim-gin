import { autocmd, Denops, flags, fn, helper } from "../../deps.ts";
import { getOrFindWorktree, normCmdArgs } from "../../util/cmd.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  await autocmd.emit(denops, "User", "GinCommandPre", {
    nomodeline: true,
  });
  const raws: string[] = [];
  const opts = flags.parse(await normCmdArgs(denops, args), {
    string: [
      "-worktree",
    ],
    unknown: (arg) => {
      raws.push(arg);
      return false;
    },
  });
  const worktree = await getOrFindWorktree(denops, opts);
  const env = await fn.environ(denops) as Record<string, string>;
  const proc = run(await normCmdArgs(denops, raws), {
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
  if (!status.success) {
    await denops.cmd("echohl Error");
    await helper.echo(denops, decodeUtf8(stderr));
    await denops.cmd("echohl None");
  } else {
    await helper.echo(denops, decodeUtf8(stdout) + decodeUtf8(stderr));
    await autocmd.emit(denops, "User", "GinCommandPost", {
      nomodeline: true,
    });
  }
}

export async function bind(denops: Denops, bufnr: number): Promise<void> {
  await autocmd.group(denops, `gin_bare_command_bind_${bufnr}`, (helper) => {
    helper.remove();
    helper.define(
      "User",
      "GinCommandPost",
      `call denops#request('gin', 'reload:command', [${bufnr}])`,
      {
        nested: true,
      },
    );
  });
}
