import type { Denops } from "https://deno.land/x/denops_std@v4.1.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.1.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v4.1.0/function/mod.ts";
import * as mapping from "https://deno.land/x/denops_std@v4.1.0/mapping/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v4.1.0/variable/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as path from "https://deno.land/std@0.180.0/path/mod.ts";
import * as option from "https://deno.land/x/denops_std@v4.1.0/option/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateOpts,
} from "https://deno.land/x/denops_std@v4.1.0/argument/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.1.0/buffer/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../git/worktree.ts";
import { exec as execEdit } from "../edit/command.ts";
import { AliasHead, getInProgressAliasHead, stripConflicts } from "./util.ts";

export type CommandOptions = {
  disableDefaultArgs?: boolean;
};

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  if (!options.disableDefaultArgs) {
    const defaultArgs = await vars.g.get(
      denops,
      "gin_chaperon_default_args",
      [],
    );
    unknownutil.assertArray(defaultArgs, unknownutil.isString);
    args = [...defaultArgs, ...args];
  }
  const [opts, _, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "opener",
    "no-ours",
    "no-theirs",
    ...builtinOpts,
  ]);
  const [abspath] = parseResidue(residue);
  await exec(denops, abspath, {
    worktree: opts.worktree,
    opener: opts.opener,
    noOurs: "no-ours" in opts,
    noTheirs: "no-theirs" in opts,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  noOurs?: boolean;
  noTheirs?: boolean;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function exec(
  denops: Denops,
  filename: string,
  options: ExecOptions = {},
): Promise<void> {
  const [verbose, noSupplements, supplementHeight, disableDefaultMappings] =
    await batch
      .gather(
        denops,
        async (denops) => {
          await option.verbose.get(denops);
          await vars.g.get(denops, "gin_chaperon_supplement_disable", 0);
          await vars.g.get(denops, "gin_chaperon_supplement_height", 10);
          await vars.g.get(
            denops,
            "gin_chaperon_disable_default_mappings",
            false,
          );
        },
      ) as [number, unknown, unknown, unknown];
  unknownutil.assertNumber(noSupplements);
  unknownutil.assertNumber(supplementHeight);
  unknownutil.assertBoolean(disableDefaultMappings);

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });
  const abspath = path.isAbsolute(filename)
    ? filename
    : path.join(worktree, filename);

  const inProgressAliasHead = await getInProgressAliasHead(worktree);

  const infoWorktree = await buffer.open(denops, abspath, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });

  let infoTheirs: buffer.OpenResult | undefined;
  if (!options.noTheirs) {
    infoTheirs = await execEdit(denops, abspath, {
      worktree,
      commitish: ":3",
      opener: "topleft vsplit",
      cmdarg: options.cmdarg,
      mods: options.mods,
    });
    await fn.win_gotoid(denops, infoWorktree.winid);
  }

  let infoOurs: buffer.OpenResult | undefined;
  if (!options.noOurs) {
    infoOurs = await execEdit(denops, abspath, {
      worktree,
      commitish: ":2",
      opener: "botright vsplit",
      cmdarg: options.cmdarg,
      mods: options.mods,
    });
  }

  // Theirs
  if (infoTheirs) {
    await initTheirs(
      denops,
      infoTheirs.bufnr,
      infoWorktree.bufnr,
      disableDefaultMappings,
    );
  }

  // WORKTREE
  await initWorktree(
    denops,
    infoWorktree.bufnr,
    infoTheirs?.bufnr,
    infoOurs?.bufnr,
    disableDefaultMappings,
  );

  // Ours
  if (infoOurs) {
    await initOurs(
      denops,
      infoOurs.bufnr,
      infoWorktree.bufnr,
      disableDefaultMappings,
    );
  }

  // Supplements
  if (!noSupplements) {
    await openSupplements(
      denops,
      infoTheirs?.winid,
      infoWorktree.winid,
      infoOurs?.winid,
      supplementHeight,
      inProgressAliasHead,
    );
  }

  // edit | diffthis
  const winids = [infoWorktree, infoTheirs, infoOurs]
    .map((v) => v?.winid)
    .filter((v) => v) as number[];
  await batch.batch(denops, async (denops) => {
    for (const winid of winids) {
      await fn.win_execute(denops, winid, "diffthis", "silent!");
    }
  });

  // Focus Worktree
  await fn.win_gotoid(denops, infoWorktree.winid);
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
  disableDefaultMappings: boolean,
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
      await denops.cmd("silent! edit");
    });
  });
}

async function initWorktree(
  denops: Denops,
  bufnr: number,
  bufnrTheirs: number | undefined,
  bufnrOurs: number | undefined,
  disableDefaultMappings: boolean,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    const content = await fn.getbufline(denops, bufnr, 1, "$");
    await buffer.replace(denops, bufnr, stripConflicts(content));
    await batch.batch(denops, async (denops) => {
      if (bufnrTheirs) {
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
        if (!disableDefaultMappings) {
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
      if (bufnrOurs) {
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
        if (!disableDefaultMappings) {
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
    });
  });
}

async function initOurs(
  denops: Denops,
  bufnr: number,
  bufnrWorktree: number,
  disableDefaultMappings: boolean,
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
      await denops.cmd("silent! edit");
    });
  });
}

async function openSupplements(
  denops: Denops,
  winidTheirs: number | undefined,
  winidWorktree: number,
  winidOurs: number | undefined,
  supplementHeight: number,
  inProgressAliasHead: AliasHead | undefined,
) {
  if (winidTheirs && await fn.winbufnr(denops, winidTheirs) !== -1) {
    await batch.batch(denops, async (denops) => {
      await fn.win_gotoid(denops, winidTheirs);
      await denops.cmd(`rightbelow ${supplementHeight}split`);
      await denops.cmd(
        `silent! GinBuffer log -1 ${inProgressAliasHead} -p`,
      );
      await option.winfixheight.setLocal(denops, true);
      await option.filetype.setLocal(denops, "git");
    });
  }

  await batch.batch(denops, async (denops) => {
    await fn.win_gotoid(denops, winidWorktree);
    await denops.cmd(`rightbelow ${supplementHeight}split`);
    await denops.cmd(
      `silent! GinBuffer log --oneline --left-right ${inProgressAliasHead}...HEAD`,
    );
    await option.winfixheight.setLocal(denops, true);
    await option.filetype.setLocal(denops, "diff");
  });

  if (winidOurs) {
    await batch.batch(denops, async (denops) => {
      await fn.win_gotoid(denops, winidOurs);
      await denops.cmd(`rightbelow ${supplementHeight}split`);
      await denops.cmd("silent! GinBuffer log -1 HEAD -p");
      await option.winfixheight.setLocal(denops, true);
      await option.filetype.setLocal(denops, "git");
    });
  }
}
