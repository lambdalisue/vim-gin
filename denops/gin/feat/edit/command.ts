import {
  autocmd,
  batch,
  bufname,
  Denops,
  fn,
  fs,
  helper,
  option,
  path,
  unknownutil,
} from "../../deps.ts";
import * as flags from "../../util/flags.ts";
import * as buffer from "../../util/buffer.ts";
import { toStringArgs } from "../../util/arg.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";
import { command as bareCommand } from "../../core/bare/command.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, commitish, abspath] = parseArgs(
    await normCmdArgs(denops, args),
  );
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);

  if (!commitish && !opts["cached"]) {
    // worktree
    await buffer.open(denops, path.join(worktree, relpath));
  } else {
    // commitish/cached
    const bname = bufname.format({
      scheme: "ginedit",
      expr: worktree,
      params: {
        ...opts,
        _: undefined,
        cached: undefined,
        commitish,
      },
      fragment: relpath,
    });
    await buffer.open(denops, bname.toString());
  }
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params, fragment } = bufname.parse(bname);
  if (!fragment) {
    throw new Error("fragment is required for ginedit");
  }
  const args = [
    "show",
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
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
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
    await buffer.editData(denops, stdout);
  });
  await buffer.concrete(denops, bufnr);
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
    throw new Error("fragment is required for ginedit");
  }
  const original = path.join(expr, fragment);
  let restore: () => Promise<void>;
  try {
    const f = await Deno.makeTempFile();
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
      `---worktree=${expr}`,
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

function parseArgs(
  args: string[],
): [flags.Args, string | undefined, string] {
  const opts = flags.parse(args, [
    "cached",
  ]);
  // GinEdit [{options}] {path}
  // GinEdit [{options}] --cached {path}
  // GinEdit [{options}] {commitish} {path}
  switch (opts._.length) {
    case 1:
      return [opts, undefined, opts._[0].toString()];
    case 2:
      return [opts, opts._[0].toString(), opts._[1].toString()];
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
