import type { Denops } from "jsr:@denops/std@^7.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import {
  DefaultRenderer,
  getVisibleItems,
} from "jsr:@lambdalisue/ui-treeutil@^0.1.2";
import { execute } from "../../git/executor.ts";
import { parseLsTreeToTree } from "./parser.ts";
import { setTreeState } from "./state.ts";
import { bind } from "../../command/bare/command.ts";
import { init as initActionCore } from "../../action/core.ts";
import * as action from "./action.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params } = parseBufname(bufname);
  await exec(denops, bufnr, {
    worktree: expr,
    commitish: unnullish(
      params?.commitish,
      (x) => ensure(x, is.String, { message: "commitish must be string" }),
    ),
    flags: {
      ...params,
      commitish: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  flags?: Flags;
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  options: ExecOptions,
): Promise<void> {
  const args = [
    "ls-tree",
    "-r",
    ...formatFlags({
      ...(options.flags ?? {}),
    }),
    options.commitish ?? "HEAD",
  ];

  const { stdout } = await execute(denops, args, {
    worktree: options.worktree,
    throwOnError: true,
    stdoutIndicator: "null",
  });

  // Decode the stdout from Uint8Array to string
  const { content } = await buffer.decode(denops, bufnr, stdout, {
    fileformat: options.fileformat,
    fileencoding: options.encoding,
  });
  const output = content.join("\n");

  // Parse the git ls-tree output into a tree structure
  const tree = parseLsTreeToTree(output, options.commitish ?? "HEAD");

  // Get visible items and render them
  const items = getVisibleItems(tree);
  const renderer = new DefaultRenderer();
  const lines = renderer.render(items);

  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      // Store tree state in buffer variable
      await setTreeState(denops, bufnr, {
        tree,
        commitish: options.commitish ?? "HEAD",
        worktree: options.worktree ?? "",
      });

      await buffer.replace(denops, bufnr, lines);
      await option.bufhidden.setLocal(denops, "hide");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.filetype.setLocal(denops, "gin-tree");
      if (options.fileformat) {
        await option.fileformat.setLocal(denops, options.fileformat);
      }
      if (options.encoding) {
        await option.fileencoding.setLocal(denops, options.encoding);
      }

      // Initialize actions
      await bind(denops, bufnr);
      await initActionCore(denops, bufnr);
    });
  });
}

