import {
  autocmd,
  batch,
  bufname,
  Denops,
  fn,
  fs,
  option,
  path,
  unknownutil,
  vars,
} from "../../deps.ts";
import {
  builtinOpts,
  formatBuiltinOpts,
  parseArgs,
  validateFlags,
  validateOpts,
} from "../../util/args.ts";
import * as helper from "../../util/helper.ts";
import * as buffer from "../../util/buffer.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";
import { command as bareCommand } from "../../core/bare/command.ts";
import { bind } from "../../core/bare/command.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, flags, residue] = parseArgs(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    ...builtinOpts,
  ]);
  validateFlags(flags, [
    "cached",
  ]);
  const [commitish, abspath] = parseResidue(residue);
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);
  const cmdarg = formatBuiltinOpts(opts);

  if (!commitish && flags.cached == null) {
    // worktree
    await buffer.open(denops, path.join(worktree, relpath), cmdarg);
  } else {
    // commitish/cached
    const bname = bufname.format({
      scheme: "ginedit",
      expr: worktree,
      params: {
        ...flags,
        cached: undefined,
        commitish,
      },
      fragment: relpath,
    });
    await buffer.open(denops, bname.toString(), cmdarg);
  }
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname, cmdarg] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
    await vars.v.get(denops, "cmdarg");
  }) as [number, string, string];
  const { expr, params, fragment } = bufname.parse(bname);
  if (!fragment) {
    throw new Error("A buffer 'ginedit://' requires a fragment part");
  }
  const args = [
    "show",
    ...formatTreeish(params?.commitish, fragment),
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
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await denops.cmd("filetype detect");
      if (params?.commitish) {
        await option.buftype.setLocal(denops, "nowrite");
        await option.swapfile.setLocal(denops, false);
        await option.modifiable.setLocal(denops, false);
      } else {
        await option.buftype.setLocal(denops, "acwrite");
        await option.swapfile.setLocal(denops, false);
        await autocmd.group(denops, "gitedit_read_internal", (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call denops#request('gin', 'edit:write', [])`,
            {
              nested: true,
            },
          );
        });
      }
    });
    await buffer.editData(denops, stdout, {
      cmdarg,
    });
  });
  await buffer.concrete(denops, bufnr);
  if (!status.success) {
    await helper.echoerr(denops, decodeUtf8(stderr));
  }
}

export async function write(denops: Denops): Promise<void> {
  const [bufnr, bname, content] = await batch.gather(
    denops,
    async (denops) => {
      await fn.bufnr(denops);
      await fn.bufname(denops);
      await fn.getline(denops, 1, "$");
    },
  ) as [number, string, string[], Record<string, string>];
  const { expr, fragment } = bufname.parse(bname);
  if (!fragment) {
    throw new Error("A buffer 'ginedit://' requires a fragment part");
  }
  const original = path.join(expr, fragment);
  let restore: () => Promise<void>;
  try {
    const f = await Deno.makeTempFile({
      dir: path.dirname(original),
    });
    await Deno.rename(original, f);
    restore = () => Deno.rename(f, original);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
    restore = () => Deno.remove(original);
  }
  try {
    await fs.ensureFile(original);
    await Deno.writeTextFile(original, `${content.join("\n")}\n`);
    await bareCommand(denops, [
      `++worktree=${expr}`,
      "add",
      "--force",
      "--",
      fragment,
    ]);
    await fn.setbufvar(denops, bufnr, "&modified", 0);
    await helper.echo(denops, `[gin] INDEX of '${fragment}' is updated.`);
  } finally {
    await restore();
  }
}

function parseResidue(
  residue: string[],
): [string | undefined, string] {
  // GinEdit [{options}] {path}
  // GinEdit [{options}] --cached {path}
  // GinEdit [{options}] {commitish} {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0].toString()];
    case 2:
      return [residue[0].toString(), residue[1].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}

function formatTreeish(
  commitish: string | string[] | undefined,
  relpath: string,
): [] | [string] {
  if (commitish) {
    unknownutil.ensureString(commitish);
    return [`${commitish}:${relpath}`];
  } else {
    return [`:${relpath}`];
  }
}
