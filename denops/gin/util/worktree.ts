import type { Denops } from "https://deno.land/x/denops_std@v3.9.2/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.9.2/batch/mod.ts";
import { parse as parseBufname } from "https://deno.land/x/denops_std@v3.9.2/bufname/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.9.2/function/mod.ts";
import * as path from "https://deno.land/std@0.165.0/path/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { GIN_BUFFER_PROTOCOLS } from "../global.ts";
import { expand } from "../util/cmd.ts";
import { find } from "../git/finder.ts";

/**
 * Find a git worktree from a suspected directory
 */
async function findWorktreeFromSuspect(
  suspect: string,
  verbose?: boolean,
): Promise<string> {
  // Check if 'anchor' is a gin buffer name
  try {
    const { scheme, expr } = parseBufname(suspect);
    if (verbose) {
      console.debug(`The anchor scheme is '${scheme}' and expr is '${expr}'`);
    }
    if (GIN_BUFFER_PROTOCOLS.includes(scheme)) {
      // GIN_BUFFER_PROTOCOLS always records an absolute path in `expr`
      return expr;
    }
  } catch {
    // Failed to execute 'parseBufname(suspect)' means that the 'suspect' seems a real filepath.
    const candidates = new Set(await normSuspect(suspect));
    for (const c of candidates) {
      if (verbose) {
        console.debug(`Trying to find a git repository from '${c}'`);
      }
      try {
        return await find(c);
      } catch {
        // Fail silently
      }
    }
  }
  throw new Error(`No git repository found (searched from ${suspect})`);
}

/**
 * Find a git worktree from suspected directories
 */
async function findWorktreeFromSuspects(
  suspects: string[],
  verbose?: boolean,
): Promise<string> {
  for (const suspect of suspects) {
    try {
      return await findWorktreeFromSuspect(suspect, verbose);
    } catch {
      // Fail silently
    }
  }
  throw new Error(
    `No git repository found (searched from ${
      [...suspects.values()].join(", ")
    })`,
  );
}

/**
 * Return candidates of worktree anchor directories from the host environment
 */
async function listWorktreeSuspectsFromDenops(
  denops: Denops,
  verbose?: boolean,
): Promise<string[]> {
  const [cwd, bufname] = await batch.gather(
    denops,
    async (denops) => {
      await fn.getcwd(denops);
      await fn.expand(denops, "%:p");
    },
  );
  unknownutil.assertString(cwd);
  unknownutil.assertString(bufname);
  if (verbose) {
    console.debug("listWorktreeSuspectsFromDenops");
    console.debug(`  cwd: ${cwd}`);
    console.debug(`  bufname: ${bufname}`);
  }
  return [bufname, cwd];
}

async function normSuspect(suspect: string): Promise<string[]> {
  try {
    const [stat, lstat] = await Promise.all([
      Deno.stat(suspect),
      Deno.lstat(suspect),
    ]);
    if (lstat.isSymlink) {
      if (stat.isFile) {
        return [
          path.dirname(suspect),
          path.dirname(await Deno.realPath(suspect)),
        ];
      } else {
        return [
          suspect,
          await Deno.realPath(suspect),
        ];
      }
    } else {
      if (stat.isFile) {
        return [path.dirname(suspect)];
      } else {
        return [suspect];
      }
    }
  } catch (err) {
    if (err instanceof Deno.errors.NotFound) {
      return [];
    }
    throw err;
  }
}

/**
 * Find a git worktree from the host environment
 */
export async function findWorktreeFromDenops(
  denops: Denops,
  options: FindWorktreeFromDenopsOptions = {},
): Promise<string> {
  return await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!options.verbose),
    !!options.verbose,
  );
}

export type FindWorktreeFromDenopsOptions = {
  worktree?: string;
  verbose?: boolean;
};
