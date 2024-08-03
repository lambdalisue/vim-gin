import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { Silent } from "jsr:@denops/std@^7.0.0/helper";
import { expand } from "./expand.ts";

export function parseSilent(mods: string): Silent {
  if (mods.indexOf("silent!") !== -1) {
    return "silent!";
  } else if (mods.indexOf("silent") !== -1) {
    return "silent";
  }
  return "";
}

export async function normCmdArgs(
  denops: Denops,
  args: string[],
): Promise<string[]> {
  // To reduce RPC, cache result of an arg which starts from '%' or '#'
  const cache: Map<string, Promise<string>> = new Map();
  return await Promise.all(args.map((arg) => normCmdArg(denops, arg, cache)));
}

async function normCmdArg(
  denops: Denops,
  arg: string,
  cache: Map<string, Promise<string>>,
): Promise<string> {
  if (cache.has(arg)) {
    return await cache.get(arg)!;
  }
  if (arg.startsWith("%") || arg.startsWith("#")) {
    const p = expand(denops, arg);
    cache.set(arg, p);
    return await p;
  }
  return arg.replaceAll(/^\\(%|#)/g, "$1");
}

export async function fillCmdArgs(
  denops: Denops,
  args: string[],
  command: string,
): Promise<string[]> {
  const defaultArgsVarName = `gin_${command}_default_args`;
  const persistentArgsVarName = `gin_${command}_persistent_args`;
  const [defaultArgs, persistentArgs] = await batch.collect(
    denops,
    (denops) => [
      vars.g.get(denops, defaultArgsVarName, []),
      vars.g.get(denops, persistentArgsVarName, []),
    ],
  );
  assert(defaultArgs, is.ArrayOf(is.String), {
    name: `g:${defaultArgsVarName}`,
  });
  assert(persistentArgs, is.ArrayOf(is.String), {
    name: `g:${persistentArgsVarName}`,
  });
  return [...persistentArgs, ...(args.length === 0 ? defaultArgs : args)];
}
