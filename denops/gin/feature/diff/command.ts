import { batch, Denops, fn, helper, option } from "../../deps.ts";
import * as buffer from "../../core/buffer.ts";
import { normCmdArgs } from "../../core/cmd.ts";
import { find } from "../../git/finder.ts";
import { format, parse } from "../../core/bufname.ts";
import { run } from "../../git/process.ts";
import { decodeUtf8 } from "../../text.ts";

export async function command(
  denops: Denops,
  ...args: string[]
): Promise<void> {
  const cwd = await fn.getcwd(denops, 0) as string;
  const worktree = await find(cwd);
  const bufname = format({
    scheme: "gindiff",
    path: worktree,
    params: {
      args: await normCmdArgs(denops, args),
    },
  });
  await buffer.open(denops, bufname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bufname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { path, params } = parse(bufname);
  const env = await fn.environ(denops) as Record<string, string>;
  const proc = run(["diff", ...params!.args as string[]], {
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    noOptionalLocks: true,
    cwd: path,
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
    return;
  }
  const content = decodeUtf8(stdout).split("\n");
  await batch.batch(denops, async (denops) => {
    await option.filetype.setLocal(denops, "diff");
    await option.modifiable.setLocal(denops, false);
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}
