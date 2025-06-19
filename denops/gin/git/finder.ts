import { resolve } from "jsr:@std/path@^1.0.0";
import { Cache } from "jsr:@lambdalisue/ttl-cache@^1.0.0";
import { execute } from "./process.ts";
import { decodeUtf8 } from "../util/text.ts";

const ttl = 30000; // seconds
const cacheWorktree = new Cache<string, string | Error>(ttl);
const cacheGitdir = new Cache<string, string | Error>(ttl);

/**
 * Check if we've reached the filesystem root by comparing a path with its parent.
 * This works cross-platform (Windows, Linux, Mac).
 *
 * @param currentPath - The path to check
 * @returns true if the path is the filesystem root, false otherwise
 */
function isFilesystemRoot(currentPath: string): boolean {
  return currentPath === resolve(currentPath, "..");
}

/**
 * Find a root path of a git working directory.
 *
 * @param cwd - A current working directory.
 * @returns A root path of a git working directory.
 */
export async function findWorktree(cwd: string): Promise<string> {
  const path = await Deno.realPath(cwd);
  const result = cacheWorktree.get(path) ?? await (async () => {
    let result: string | Error;
    try {
      // Search upward from current directory to find worktree root
      let currentPath = path;
      while (!isFilesystemRoot(currentPath)) {
        if (await isWorktreeRoot(currentPath)) {
          result = currentPath;
          cacheWorktree.set(path, result);
          return result;
        }
        currentPath = resolve(currentPath, "..");
      }

      // If no worktree found, use normal detection for regular repositories
      result = await revParse(path, [
        "--show-toplevel",
        "--show-superproject-working-tree",
      ]);
    } catch (e) {
      if (e instanceof Error) {
        result = e;
      } else {
        throw e;
      }
    }
    cacheWorktree.set(path, result);
    return result;
  })();
  if (result instanceof Error) {
    throw result;
  }
  return result;
}

/**
 * Find a .git directory of a git working directory.
 *
 * @param cwd - A current working directory.
 * @returns A root path of a git working directory.
 */
export async function findGitdir(cwd: string): Promise<string> {
  const path = await Deno.realPath(cwd);
  const result = cacheGitdir.get(path) ?? await (async () => {
    let result: string | Error;
    try {
      result = await revParse(path, ["--git-dir"]);
    } catch (e) {
      if (e instanceof Error) {
        result = e;
      } else {
        throw e;
      }
    }
    cacheGitdir.set(path, result);
    return result;
  })();
  if (result instanceof Error) {
    throw result;
  }
  return result;
}

async function isWorktreeRoot(currentPath: string): Promise<boolean> {
  try {
    const gitPath = resolve(currentPath, ".git");
    const stat = await Deno.stat(gitPath);
    if (stat.isFile) {
      // Found a .git file, verify it's a valid git worktree
      await revParse(currentPath, ["--git-dir"]);
      return true;
    }
  } catch {
    // Either .git doesn't exist or it's not a valid worktree
  }
  return false;
}

async function revParse(cwd: string, args: string[]): Promise<string> {
  const stdout = await execute(["rev-parse", ...args], { cwd });
  const output = decodeUtf8(stdout);
  return resolve(cwd, output.split(/\n/, 2)[0]);
}
