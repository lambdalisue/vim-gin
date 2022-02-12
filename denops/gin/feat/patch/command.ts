import {
  Denops,
  batch,
  fn,
  mapping,
  path,
} from "../../deps.ts";
import * as flags from "../../util/flags.ts";
import * as buffer from "../../util/buffer.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { command as editCommand } from "../edit/command.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, abspath] = parseArgs(
    await normCmdArgs(denops, args),
  );
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);

  await denops.cmd("tabedit")

  let bufnrHead = -1;
  if (!opts["without-head"]) {
    await editCommand(denops, [`---worktree=${worktree}`, "HEAD", relpath]);
    bufnrHead = await fn.bufnr(denops);
    await denops.cmd("botright vsplit")
  }

  await editCommand(denops, [`---worktree=${worktree}`, "--cached", relpath]);
  const bufnrIndex = await fn.bufnr(denops);

  let bufnrWorktree = -1;
  if (!opts["without-worktree"]) {
    await denops.cmd("botright vsplit")
    await editCommand(denops, [`---worktree=${worktree}`, "", relpath]);
    bufnrWorktree = await fn.bufnr(denops);
  }

  // HEAD
  if (bufnrHead !== -1) {
    await buffer.ensure(denops, bufnrHead, async () => {
      await batch.batch(denops, async (denops) => {
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffput)",
          `<Cmd>diffput ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "dp",
          "<Plug>(gin-patch-diffput)",
          {
            buffer: true,
          },
        );
        await denops.cmd("diffthis");
      });
    });
  }

  // INDEX
  await buffer.ensure(denops, bufnrIndex, async () => {
    await batch.batch(denops, async (denops) => {
      if (bufnrHead !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffget-l)",
          `<Cmd>diffget ${bufnrHead}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffget)",
          "<Plug>(gin-patch-diffget-l)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "dol",
          "<Plug>(gin-patch-diffget-l)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "do",
          "<Plug>(gin-patch-diffget)",
          {
            buffer: true,
          },
        );
      }
      if (bufnrWorktree !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffput)",
          `<Cmd>diffput ${bufnrWorktree}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffget-r)",
          `<Cmd>diffget ${bufnrWorktree}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffget)",
          "<Plug>(gin-patch-diffget-r)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "dp",
          "<Plug>(gin-patch-diffput)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "dor",
          "<Plug>(gin-patch-diffget-r)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "do",
          "<Plug>(gin-patch-diffget)",
          {
            buffer: true,
          },
        );
      }
      await denops.cmd("diffthis");
    });
  });

  // WORKTREE
  if (bufnrWorktree !== -1) {
    await buffer.ensure(denops, bufnrWorktree, async () => {
      await batch.batch(denops, async (denops) => {
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffput)",
          `<Cmd>diffput ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-patch-diffget)",
          `<Cmd>diffget ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "dp",
          "<Plug>(gin-patch-diffput)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "do",
          "<Plug>(gin-patch-diffget)",
          {
            buffer: true,
          },
        );
        await denops.cmd("diffthis");
      });
    });
  }

  // Focus INDEX
  const winid = await fn.bufwinid(denops, bufnrIndex);
  await fn.win_gotoid(denops, winid);
}

function parseArgs(
  args: string[],
): [flags.Args, string] {
  const opts = flags.parse(args, [
    "without-head",
    "without-worktree",
  ]);
  // GinPatch [{options}] {path}
  switch (opts._.length) {
    case 1:
      return [opts, opts._[0].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}
