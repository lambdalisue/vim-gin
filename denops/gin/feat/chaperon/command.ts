import {
  batch,
  Denops,
  fn,
  mapping,
  path,
  unknownutil,
  vars,
} from "../../deps.ts";
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
import { stripConflicts } from "./util.ts";

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
    "without-ours",
    "without-theirs",
    "without-supplements",
  ]);
  const [abspath] = parseResidue(residue);
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpath = path.relative(worktree, abspath);
  const leading = formatOpts(opts, builtinOpts);

  const withoutTheirs = "without-theirs" in flags;
  const withoutOurs = "without-ours" in flags;
  const withoutSupplements = "without-supplements" in flags;

  const supplementHeight = withoutSupplements
    ? 0
    : await vars.g.get(denops, "gin_chaperon_supplement_height", 10 as unknown);
  unknownutil.ensureNumber(supplementHeight);

  await denops.cmd("tabedit");

  let bufnrTheirs = -1;
  if (!withoutTheirs) {
    await editCommand(denops, [
      ...leading,
      `++worktree=${worktree}`,
      ":3",
      relpath,
    ]);
    bufnrTheirs = await fn.bufnr(denops);
    await denops.cmd("botright vsplit");
  }

  await editCommand(denops, [
    ...leading,
    `++worktree=${worktree}`,
    relpath,
  ]);
  const bufnrWorktree = await fn.bufnr(denops);

  let bufnrOurs = -1;
  if (!withoutOurs) {
    await denops.cmd("botright vsplit");
    await editCommand(denops, [
      ...leading,
      `++worktree=${worktree}`,
      ":2",
      relpath,
    ]);
    bufnrOurs = await fn.bufnr(denops);
  }

  // Theirs
  if (bufnrTheirs !== -1) {
    await initTheirs(denops, bufnrTheirs, bufnrWorktree, supplementHeight);
  }

  // WORKTREE
  await initWorktree(
    denops,
    bufnrWorktree,
    bufnrTheirs,
    bufnrOurs,
    supplementHeight,
  );

  // Ours
  if (bufnrOurs !== -1) {
    await initOurs(denops, bufnrOurs, bufnrWorktree, supplementHeight);
  }

  // Focus Worktree
  const winid = await fn.bufwinid(denops, bufnrWorktree);
  await fn.win_gotoid(denops, winid);
}

function parseResidue(
  residue: string[],
): [string] {
  // GinChaperon [{options}] {path}
  switch (residue.length) {
    case 1:
      return [residue[0]];
    default:
      throw new Error("Invalid number of arguments");
  }
}

async function initTheirs(
  denops: Denops,
  bufnr: number,
  bufnrWorktree: number,
  supplementHeight: number,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
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
        "dp",
        "<Plug>(gin-diffput)",
        {
          buffer: true,
        },
      );
      await denops.cmd("diffthis");
    });
    if (supplementHeight) {
      await denops.cmd(
        `leftabove ${supplementHeight}split | Gin! ++buffer log -1 MERGE_HEAD -p | set filetype=git`,
      );
    }
  });
}

async function initOurs(
  denops: Denops,
  bufnr: number,
  bufnrWorktree: number,
  supplementHeight: number,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
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
        "dp",
        "<Plug>(gin-diffput)",
        {
          buffer: true,
        },
      );
      await denops.cmd("diffthis");
    });
    if (supplementHeight) {
      await denops.cmd(
        `leftabove ${supplementHeight}split | Gin! ++buffer log -1 ORIG_HEAD -p | set filetype=git`,
      );
    }
  });
}

async function initWorktree(
  denops: Denops,
  bufnr: number,
  bufnrTheirs: number,
  bufnrOurs: number,
  supplementHeight: number,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    const content = await fn.getbufline(denops, bufnr, 1, "$");
    await buffer.replace(denops, bufnr, stripConflicts(content));
    await batch.batch(denops, async (denops) => {
      if (bufnrTheirs !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-diffget-l)",
          `<Cmd>diffget ${bufnrTheirs}<CR><Cmd>diffupdate<CR>`,
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
      if (bufnrOurs !== -1) {
        await mapping.map(
          denops,
          "<Plug>(gin-diffget-r)",
          `<Cmd>diffget ${bufnrOurs}<CR><Cmd>diffupdate<CR>`,
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
      await denops.cmd("diffthis");
    });
    if (supplementHeight) {
      await denops.cmd(
        `leftabove ${supplementHeight}split | Gin! ++buffer log --oneline --left-right HEAD...MERGE_HEAD | set filetype=diff`,
      );
    }
  });
}
