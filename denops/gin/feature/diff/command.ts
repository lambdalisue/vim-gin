import { batch, bufname, Denops, fn, helper, option } from "../../deps.ts";
import * as buffer from "../../core/buffer.ts";
import { normCmdArgs } from "../../core/cmd.ts";
import { find } from "../../git/finder.ts";
import { run } from "../../git/process.ts";
import { decodeUtf8 } from "../../text.ts";

export async function command(
  denops: Denops,
  ...args: string[]
): Promise<void> {
  const cwd = await fn.getcwd(denops, 0) as string;
  const worktree = await find(cwd);
  const bname = bufname.format({
    scheme: "gindiff",
    expr: worktree,
    params: {
      args: await normCmdArgs(denops, args),
    },
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params } = bufname.parse(bname);
  const env = await fn.environ(denops) as Record<string, string>;
  const proc = run(["diff", ...params!.args as string[]], {
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    noOptionalLocks: true,
    cwd: expr,
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
