import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.1.0/mod.ts";
import {
  assertArray,
  ensureString,
  isString,
} from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.8.1/batch/mod.ts";
import * as mapping from "https://deno.land/x/denops_std@v3.8.1/mapping/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.1/variable/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import { exec as execBuffer } from "../../core/buffer/edit.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const [cmdarg, postProcessor] = await batch.gather(denops, async (denops) => {
    await vars.v.get(denops, "cmdarg");
    await vars.g.get(denops, "gin_diff_post_processor");
  }) as [string, unknown];
  assertArray(postProcessor, isString);
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { scheme, expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  await exec(denops, bufnr, fragment, {
    postProcessor,
    worktree: expr,
    commitish: unnullish(params?.commitish, ensureString) ?? undefined,
    flags: {
      ...params,
      commitish: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  postProcessor?: string[];
  worktree?: string;
  commitish?: string;
  flags?: Flags;
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  relpath: string,
  options: ExecOptions,
): Promise<void> {
  const args = [
    "diff",
    ...formatFlags(options.flags ?? {}),
    ...unnullish(options.commitish, (v) => [v]) ?? [],
    relpath,
  ];
  await execBuffer(denops, bufnr, args, {
    postProcessor: options.postProcessor,
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await option.filetype.setLocal(denops, "gin-diff");
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
      await mapping.map(
        denops,
        "<Plug>(gin-diffjump-old)",
        `<Cmd>call denops#request('gin', 'diff:jump:old', [])<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      await mapping.map(
        denops,
        "<Plug>(gin-diffjump-new)",
        `<Cmd>call denops#request('gin', 'diff:jump:new', [])<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
    });
  });
}
