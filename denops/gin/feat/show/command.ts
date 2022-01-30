import {
  batch,
  bufname,
  Denops,
  flags,
  fn,
  helper,
  option,
  unknownutil,
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
  const [opts, commitish, path] = parseArgs(
    await normCmdArgs(denops, args),
    filemode,
  );
  const worktree = opts["-worktree"]
    ? await fn.fnamemodify(denops, opts["-worktree"], ":p") as string
    : await getWorktree(denops);
  const bname = bufname.format({
    scheme: "ginshow",
    expr: worktree,
    params: {
      ...opts,
      _: undefined,
      commitish,
    },
    fragment: path,
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
    "show",
    ...toBooleanArgs(params, "show-signature"),
    ...formatTreeish(params?.commitish, fragment),
    "--",
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
    if (fragment) {
      await denops.cmd("filetype detect");
    } else {
      await option.filetype.setLocal(denops, "diff");
    }
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
  });
  if (filemode) {
    // GinShowFile [{options}] [{commitish}] {path}
    switch (opts._.length) {
      case 1:
        return [opts, undefined, opts._[0].toString()];
      case 2:
        return [opts, opts._[0].toString(), opts._[1].toString()];
      default:
        throw new Error("Invalid number of arguments");
    }
  } else {
    // GinShow [{options}] [{commitish}]
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

function formatTreeish(
  commitish?: string | string[],
  path?: string,
): [] | [string] {
  if (commitish) {
    unknownutil.ensureString(commitish);
    return path ? [`${commitish}:${path}`] : [commitish]
  } else {
    return path ? [`:${path}`] : [];
  }
}
