import type { Denops } from "https://deno.land/x/denops_std@v3.9.0/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.2.0/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.9.0/autocmd/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.9.0/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.9.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.9.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.9.0/variable/mod.ts";
import {
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.9.0/argument/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.9.0/bufname/mod.ts";
import { exec as execBare } from "../../core/bare/command.ts";
import { execute, ExecuteError } from "../../core/executor.ts";
import { formatTreeish, isExistsOnDistButNotInTheIndex } from "./util.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { removeAnsiEscapeCode } from "../../util/ansi_escape_code.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const [cmdarg, autoIntentToAdd] = await batch.gather(
    denops,
    async (denops) => {
      await vars.v.get(denops, "cmdarg");
      await vars.g.get(denops, "gin_edit_auto_intent_to_add");
    },
  ) as [string, unknown];

  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, ["enc", "encoding", "ff", "fileformat"]);
  const { scheme, expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  await exec(denops, bufnr, fragment, {
    worktree: expr,
    commitish: unnullish(params?.commitish, ensureString),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    autoIntentToAdd: !!autoIntentToAdd,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  encoding?: string;
  fileformat?: string;
  autoIntentToAdd?: boolean;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  relpath: string,
  options: ExecOptions,
): Promise<void> {
  const filename = relpath.replaceAll("\\", "/");
  const args = ["show", ...formatTreeish(options.commitish, filename)];
  const { success, stdout, stderr } = await execute(denops, args, {
    worktree: options.worktree,
  });
  if (!success) {
    const errorMessage = decodeUtf8(stderr);
    if (
      options.autoIntentToAdd && isExistsOnDistButNotInTheIndex(errorMessage)
    ) {
      // Execute intent-to-add
      await execBare(denops, ["add", "--intent-to-add", filename], options);
      // Retry
      return exec(denops, bufnr, relpath, {
        ...options,
        autoIntentToAdd: false,
      });
    }
    throw new ExecuteError(removeAnsiEscapeCode(errorMessage));
  }
  const { content, fileformat, fileencoding } = await buffer.decode(
    denops,
    bufnr,
    stdout,
    {
      fileformat: options.fileformat,
      fileencoding: options.encoding,
    },
  );
  await buffer.replace(denops, bufnr, content, {
    fileformat,
    fileencoding,
  });
  await buffer.concrete(denops, bufnr);
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("filetype detect");
      await option.swapfile.setLocal(denops, false);
      await option.bufhidden.setLocal(denops, "unload");
      if (options.commitish) {
        await option.buftype.setLocal(denops, "nowrite");
      } else {
        await option.buftype.setLocal(denops, "acwrite");
        await autocmd.group(denops, "gin_feat_edit_edit_internal", (helper) => {
          helper.remove("*", "<buffer>");
          helper.define(
            "BufWriteCmd",
            "<buffer>",
            `call denops#request('gin', 'edit:write', [bufnr(), expand('<amatch>')])`,
            {
              nested: true,
            },
          );
        });
      }
    });
  });
}
