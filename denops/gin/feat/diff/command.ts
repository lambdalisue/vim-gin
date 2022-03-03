import {
  batch,
  bufname,
  Denops,
  fn,
  helper,
  option,
  path,
  unknownutil,
  vars,
} from "../../deps.ts";
import {
  builtinOpts,
  formatFlags,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "../../util/args.ts";
import * as buffer from "../../util/buffer.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    ...builtinOpts,
  ]);
  validateFlags(flags, [
    "R",
    "b",
    "w",
    "I",
    "cached",
    "renames",
    "diff-filter",
    "ignore-cr-at-eol",
    "ignore-space-at-eol",
    "ignore-space-change",
    "ignore-all-space",
    "ignore-blank-lines",
    "ignore-matching-lines",
    "ignore-submodules",
  ]);
  const [commitish, abspath] = parseResidue(residue);
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);
  const cmdarg = formatOpts(opts, builtinOpts).join(" ");
  const bname = bufname.format({
    scheme: "gindiff",
    expr: worktree,
    params: {
      ...flags,
      commitish,
    },
    fragment: relpath,
  });
  await buffer.open(denops, bname.toString(), { cmdarg });
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname, cmdarg] = unknownutil.ensureLike(
    [0, "", ""],
    await batch.gather(denops, async (denops) => {
      await fn.bufnr(denops, "%");
      await fn.bufname(denops, "%");
      await vars.v.get(denops, "cmdarg");
    }),
  );
  const { expr, params, fragment } = bufname.parse(bname);
  if (!fragment) {
    throw new Error("A buffer 'gindiff://' requires a fragment part");
  }
  const flags = {
    ...params ?? {},
    commitish: undefined,
  };
  const args = [
    "diff",
    "--no-color",
    ...formatFlags(flags),
    ...(params?.commitish ? [unknownutil.ensureString(params.commitish)] : []),
    fragment,
  ];
  const [env, verbose] = await batch.gather(denops, async (denops) => {
    await fn.environ(denops);
    await option.verbose.get(denops);
  });
  unknownutil.assertObject(env, unknownutil.isString);
  unknownutil.assertNumber(verbose);
  const proc = run(args, {
    printCommand: !!verbose,
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
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
    });
    await buffer.editData(denops, stdout, {
      cmdarg,
    });
  });
  await buffer.concrete(denops, bufnr);
}

function parseResidue(residue: string[]): [string | undefined, string] {
  // GinDiff [{options}] [{commitish}] {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0].toString()];
    case 2:
      return [residue[0].toString(), residue[1].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}
