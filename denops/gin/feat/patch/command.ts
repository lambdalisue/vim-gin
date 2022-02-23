import { batch, Denops, fn, mapping, unknownutil, vars } from "../../deps.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "../../util/args.ts";
import * as buffer from "../../util/buffer.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { command as editCommand } from "../edit/command.ts";

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
    "without-head",
    "without-worktree",
  ]);
  const [abspath] = parseResidue(residue);
  const worktree = await getWorktreeFromOpts(denops, opts);
  const leading = formatOpts(opts, builtinOpts);

  const disableDefaultMappings = await vars.g.get(
    denops,
    "gin_patch_disable_default_mappings",
    false,
  );
  unknownutil.ensureBoolean(disableDefaultMappings);

  let bufnrHead = -1;
  if (!flags["without-head"]) {
    await editCommand(denops, [
      ...leading,
      `++worktree=${worktree}`,
      "HEAD",
      abspath,
    ]);
    bufnrHead = await fn.bufnr(denops);
    await denops.cmd("botright vsplit");
  }

  await editCommand(denops, [
    ...leading,
    `++worktree=${worktree}`,
    "--cached",
    abspath,
  ]);
  const bufnrIndex = await fn.bufnr(denops);

  let bufnrWorktree = -1;
  if (!flags["without-worktree"]) {
    await denops.cmd("botright vsplit");
    await editCommand(denops, [
      ...leading,
      `++worktree=${worktree}`,
      "",
      abspath,
    ]);
    bufnrWorktree = await fn.bufnr(denops);
  }

  // HEAD
  if (bufnrHead !== -1) {
    await initHead(denops, bufnrHead, bufnrIndex, disableDefaultMappings);
  }

  // INDEX
  await initIndex(
    denops,
    bufnrIndex,
    bufnrHead,
    bufnrWorktree,
    disableDefaultMappings,
  );

  // WORKTREE
  if (bufnrWorktree !== -1) {
    await initWorktree(
      denops,
      bufnrWorktree,
      bufnrIndex,
      disableDefaultMappings,
    );
  }

  // Focus INDEX
  const winid = await fn.bufwinid(denops, bufnrIndex);
  await fn.win_gotoid(denops, winid);
}

function parseResidue(
  residue: string[],
): [string] {
  // GinPatch [{options}] {path}
  switch (residue.length) {
    case 1:
      return [residue[0]];
    default:
      throw new Error("Invalid number of arguments");
  }
}

async function initHead(
  denops: Denops,
  bufnr: number,
  bufnrIndex: number,
  disableDefaultMappings: boolean,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await mapping.map(
        denops,
        "<Plug>(gin-diffput)",
        `<Cmd>diffput ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      if (!disableDefaultMappings) {
        await mapping.map(
          denops,
          "dp",
          "<Plug>(gin-diffput)",
          {
            buffer: true,
          },
        );
      }
      await denops.cmd("diffthis");
    });
  });
}

async function initWorktree(
  denops: Denops,
  bufnr: number,
  bufnrIndex: number,
  disableDefaultMappings: boolean,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await mapping.map(
        denops,
        "<Plug>(gin-diffput)",
        `<Cmd>diffput ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      await mapping.map(
        denops,
        "<Plug>(gin-diffget)",
        `<Cmd>diffget ${bufnrIndex}<CR><Cmd>diffupdate<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      if (!disableDefaultMappings) {
        await mapping.map(
          denops,
          "dp",
          "<Plug>(gin-diffput)",
          {
            buffer: true,
          },
        );
        await mapping.map(
          denops,
          "do",
          "<Plug>(gin-diffget)",
          {
            buffer: true,
          },
        );
      }
      await denops.cmd("diffthis");
    });
  });
}

async function initIndex(
  denops: Denops,
  bufnr: number,
  bufnrHead: number,
  bufnrWorktree: number,
  disableDefaultMappings: boolean,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      if (bufnrHead !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-diffget-l)",
          `<Cmd>diffget ${bufnrHead}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-diffget)",
          "<Plug>(gin-diffget-l)",
          {
            buffer: true,
          },
        );
        if (disableDefaultMappings) {
          await mapping.map(
            denops,
            "dol",
            "<Plug>(gin-diffget-l)",
            {
              buffer: true,
            },
          );
          await mapping.map(
            denops,
            "do",
            "<Plug>(gin-diffget)",
            {
              buffer: true,
            },
          );
        }
      }
      if (bufnrWorktree !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-diffput)",
          `<Cmd>diffput ${bufnrWorktree}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-diffget-r)",
          `<Cmd>diffget ${bufnrWorktree}<CR><Cmd>diffupdate<CR>`,
          {
            buffer: true,
            noremap: true,
          },
        );
        await mapping.map(
          denops,
          "<Plug>(gin-diffget)",
          "<Plug>(gin-diffget-r)",
          {
            buffer: true,
          },
        );
        if (!disableDefaultMappings) {
          await mapping.map(
            denops,
            "dp",
            "<Plug>(gin-diffput)",
            {
              buffer: true,
            },
          );
          await mapping.map(
            denops,
            "dor",
            "<Plug>(gin-diffget-r)",
            {
              buffer: true,
            },
          );
          await mapping.map(
            denops,
            "do",
            "<Plug>(gin-diffget)",
            {
              buffer: true,
            },
          );
        }
      }
      await denops.cmd("diffthis");
    });
  });
}
