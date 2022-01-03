import {
  batch,
  bufname,
  Denops,
  flags,
  fn,
  helper,
  option,
} from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";
import { toBooleanArgs, toStringArgs } from "../../util/arg.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { find } from "../../git/finder.ts";
import { run } from "../../git/process.ts";
import { parseTreeish } from "../../git/treeish.ts";

export async function command(
  denops: Denops,
  ...args: string[]
): Promise<void> {
  const opts = flags.parse(await normCmdArgs(denops, args), {
    string: [
      "-worktree",
    ],
    boolean: true,
    alias: {
      R: "reverse",
      b: "ignoreSpaceChange",
      w: "ignoreAllSpace",
      I: "ignoreMatchingLines",
    },
    "--": true,
  });
  let worktree: string;
  if (opts["-worktree"]) {
    worktree = await fn.fnamemodify(denops, opts["-worktree"], ":p") as string;
  } else {
    const cwd = await fn.getcwd(denops) as string;
    worktree = await find(cwd);
  }
  const bname = bufname.format({
    scheme: "gindiff",
    expr: worktree,
    params: {
      cached: opts["cached"],
      renames: opts["renames"],
      diffFilter: opts["diffFilter"],
      reverse: opts["reverse"],
      ignoreCrAtEol: opts["ignoreCrAtEol"],
      ignoreSpaceAtEol: opts["ignoreSpaceAtEol"],
      ignoreSpaceChange: opts["ignoreSpaceChange"],
      ignoreAllSpace: opts["ignoreAllSpace"],
      ignoreBlankLines: opts["ignoreBlankLines"],
      ignoreMatchingLines: opts["ignoreMatchingLines"],
      ignoreSubmodules: opts["ignoreSubmodules"],
      "--": opts["--"],
    },
    fragment: opts._ ? opts._.map((v) => v.toString()).join(" ") : undefined,
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params, fragment } = bufname.parse(bname);
  const [commitish, path] = parseTreeish(fragment ?? "");
  const args = [
    "diff",
    "--no-color",
    ...toBooleanArgs("--cached", params?.cached),
    ...toBooleanArgs("--renames", params?.renames, {
      falseFlag: "--no-renames",
    }),
    ...toStringArgs("--diff-filter", params?.diffFilter),
    ...toBooleanArgs("-R", params?.reverse),
    ...toBooleanArgs("--ignore-cr-at-eol", params?.ignoreCrAtEol),
    ...toBooleanArgs("--ignore-space-at-eol", params?.ignoreSpaceAtEol),
    ...toBooleanArgs("--ignore-space-change", params?.ignoreSpaceChange),
    ...toBooleanArgs("--ignore-all-space", params?.ignoreAllSpace),
    ...toBooleanArgs("--ignore-blank-lines", params?.ignoreBlankLines),
    ...toStringArgs("--ignore-matching-lines", params?.ignoreMatchingLines),
    ...toStringArgs("--ignore-submodules", params?.ignoreSubmodules),
    ...(commitish ? [commitish] : []),
    ...(path ? [path] : []),
    ...(params?.["--"] ? params["--"] : []),
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
