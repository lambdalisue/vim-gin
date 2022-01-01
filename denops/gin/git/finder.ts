import { Cache, path } from "../deps.ts";
import { execute } from "./process.ts";
import { decodeUtf8 } from "../core/text.ts";

const ttl = 30000; // seconds
const cache = new Cache<string, string | Error>(ttl);

export async function find(cwd: string): Promise<string> {
  let result: string | Error;
  if (cache.has(cwd)) {
    result = cache.get(cwd);
  } else {
    try {
      result = await findInternal(cwd);
    } catch (e) {
      result = e;
    }
  }
  if (result instanceof Error) {
    throw result;
  }
  return result;
}

async function findInternal(cwd: string): Promise<string> {
  const stdout = await execute(
    [
      "rev-parse",
      "--show-toplevel",
      "--show-superproject-working-tree",
    ],
    {
      cwd,
    },
  );
  const output = decodeUtf8(stdout);
  return path.resolve(output.split(/\n/, 2)[0]);
}
