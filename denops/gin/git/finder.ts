import { resolve, SEPARATOR } from "jsr:@std/path@^1.0.0";
import { Cache } from "jsr:@lambdalisue/ttl-cache@^1.0.0";
import { execute } from "./process.ts";
import { decodeUtf8 } from "../util/text.ts";

const ttl = 30000; // seconds
const cacheWorktree = new Cache<string, string | Error>(ttl);

/**
 * Find a root path of a git working directory.
 *
 * @param cwd - A current working directory.
 * @returns A root path of a git working directory.
 */
export async function findWorktree(cwd: string): Promise<string> {
  const result = cacheWorktree.get(cwd) ?? await (async () => {
    let result: string | Error;
    try {
      result = await revParse(cwd, [
        "--show-toplevel",
        "--show-superproject-working-tree",
      ]);
    } catch (e) {
      result = e;
    }
    cacheWorktree.set(cwd, result);
    return result;
  })();
  if (result instanceof Error) {
    throw result;
  }
  return result;
}

async function revParse(cwd: string, args: string[]): Promise<string> {
  const terms = cwd.split(SEPARATOR);
  if (terms.includes(".git")) {
    // `git rev-parse` does not work in a ".git" directory
    // so use a parent directory of it instead.
    const index = terms.indexOf(".git");
    cwd = terms.slice(0, index).join(SEPARATOR);
  }
  const stdout = await execute(["rev-parse", ...args], { cwd });
  const output = decodeUtf8(stdout);
  return resolve(output.split(/\n/, 2)[0]);
}
