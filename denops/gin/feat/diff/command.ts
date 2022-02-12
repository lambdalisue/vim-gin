import {
  batch,
  bufname,
  Denops,
  fn,
  helper,
  option,
  path,
} from "../../deps.ts";
import * as flags from "../../util/flags.ts";
import * as buffer from "../../util/buffer.ts";
import { toBooleanArgs, toStringArgs } from "../../util/arg.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, commitish, abspath] = parseArgs(
    await normCmdArgs(denops, args),
  );
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);
  const bname = bufname.format({
    scheme: "gindiff",
    expr: worktree,
    params: {
      ...opts,
      _: undefined,
      commitish,
    },
    fragment: relpath,
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params, fragment } = bufname.parse(bname);
  const args = [
    "diff",
    "--no-color",
    ...toBooleanArgs(params, "cached"),
    ...toBooleanArgs(params, "renames"),
    ...toStringArgs(params, "diff-filter"),
    ...toBooleanArgs(params, "reverse", { flag: "-R" }),
    ...toBooleanArgs(params, "ignore-cr-at-eol"),
    ...toBooleanArgs(params, "ignore-space-at-eol"),
    ...toBooleanArgs(params, "ignore-space-change"),
    ...toBooleanArgs(params, "ignore-all-space"),
    ...toBooleanArgs(params, "ignore-blank-lines"),
    ...toStringArgs(params, "ignore-matching-lines"),
    ...toStringArgs(params, "ignore-submodules"),
    ...(params?.commitish ? [params.commitish as string] : []),
    ...(fragment ? [fragment] : []),
    ...toStringArgs(params, "--", { flag: "--" }),
  ];
  const env = await fn.environ(denops) as Record<string, string>;
  const proc = run(args, {
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
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await option.filetype.setLocal(denops, "diff");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
    });
    await buffer.editData(denops, stdout);
  });
  await buffer.concrete(denops, bufnr);
}

function parseArgs(
  args: string[],
): [flags.Args, string | undefined, string] {
  const opts = flags.parse(args, [
    "cached",
    "renames",
    "diff-filter",
    "reverse",
    "ignore-cr-at-eol",
    "ignore-space-at-eol",
    "ignore-space-change",
    "ignore-all-space",
    "ignore-blank-lines",
    "ignore-matching-lines",
    "ignore-submodules",
  ], {
    alias: {
      R: "reverse",
      b: "ignore-space-change",
      w: "ignore-all-space",
      I: "ignore-matching-lines",
    },
  });
  // GinDiff [{options}] [{commitish}] {path}
  switch (opts._.length) {
    case 1:
      return [opts, undefined, opts._[0].toString()];
    case 2:
      return [opts, opts._[0].toString(), opts._[1].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}
