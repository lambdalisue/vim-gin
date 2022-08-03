import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.7.1/batch/mod.ts";
import {
  format as formatBufname,
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.7.1/bufname/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.7.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.7.1/variable/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.7.1/argument/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.7.1/buffer/mod.ts";
import {
  buildDecorationsFromAnsiEscapeCode,
} from "../../util/ansi_escape_code.ts";
import { expand, normCmdArgs } from "../../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../../util/worktree.ts";
import { exec as bareExec } from "../bare.ts";

export type Options = {
  worktree?: string;
  monochrome?: boolean;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
): Promise<void> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "monochrome",
    "ff",
    "fileformat",
    "enc",
    "encoding",
  ]);
  const options = {
    worktree: opts["worktree"],
    monochrome: "monochrome" in opts,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  };
  await exec(denops, residue, options);
}

export async function exec(
  denops: Denops,
  args: string[],
  options: Options = {},
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );
  const bufname = formatBufname({
    scheme: "gin",
    expr: worktree,
    params: {
      monochrome: options.monochrome ? "" : undefined,
    },
    fragment: JSON.stringify(args),
  });
  return await buffer.open(denops, bufname.toString(), {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error("A buffer 'gin://' requires a fragment part");
  }
  const args = [
    ...("monochrome" in (params ?? {}) ? [] : ["-c", "color.ui=always"]),
    ...unknownutil.ensureArray(JSON.parse(fragment), unknownutil.isString),
  ];
  const { stdout, stderr } = await bareExec(denops, args, {
    worktree: expr,
  });
  const result = new Uint8Array([...stdout, ...stderr]);
  const { content, fileformat, fileencoding } = await buffer.decode(
    denops,
    bufnr,
    result,
    {
      fileformat: opts["ff"] ?? opts["fileformat"],
      fileencoding: opts["enc"] ?? opts["fileencoding"],
    },
  );
  const [trimmed, decorations] = buildDecorationsFromAnsiEscapeCode(content);
  await buffer.replace(denops, bufnr, trimmed, {
    fileformat,
    fileencoding,
  });
  await buffer.decorate(denops, bufnr, decorations);
  await buffer.concrete(denops, bufnr);
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await option.filetype.setLocal(denops, "gin");
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
    });
  });
}
