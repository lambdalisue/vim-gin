import {
  batch,
  bufname,
  Denops,
  flags,
  fn,
  helper,
  path,
  option,
} from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";
import { toBooleanArgs, toStringArgs } from "../../util/arg.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktree } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
  filemode: boolean,
): Promise<void> {
  const [opts, commitish, abspath] = parseArgs(
    await normCmdArgs(denops, args),
    filemode,
  );
  const worktree = opts["-worktree"]
    ? await fn.fnamemodify(denops, opts["-worktree"], ":p") as string
    : await getWorktree(denops);
  const relpath = abspath ? path.relative(worktree, abspath) : undefined;
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
  const content = decodeUtf8(stdout).split("\n");
  await batch.batch(denops, async (denops) => {
    await option.filetype.setLocal(denops, "diff");
    await option.modifiable.setLocal(denops, false);
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}

function parseArgs(
  args: string[],
  filemode: boolean,
): [flags.Args, string | undefined, string | undefined] {
  const opts = flags.parse(args, {
    "--": true,
    string: [
      "-worktree",
    ],
    boolean: true,
    alias: {
      R: "reverse",
      b: "ignore-space-change",
      w: "ignore-all-space",
      I: "ignore-matching-lines",
    },
  });
  if (filemode) {
    // GinDiffFile [{options}] [{commitish}] {path}
    switch (opts._.length) {
      case 1:
        return [opts, undefined, opts._[0].toString()];
      case 2:
        return [opts, opts._[0].toString(), opts._[1].toString()];
      default:
        throw new Error("Invalid number of arguments");
    }
  } else {
    // GinDiff [{options}] [{commitish}]
    switch (opts._.length) {
      case 0:
        return [opts, undefined, undefined];
      case 1:
        return [opts, opts._[0].toString(), ""];
      default:
        throw new Error("Invalid number of arguments");
    }
  }
}
