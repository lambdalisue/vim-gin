import { flags } from "../deps.ts";

export type Args = flags.Args;

export function parse(
  args: string[],
  knowns: string[],
  options?: flags.ArgParsingOptions,
): flags.Args {
  const parsed = flags.parse(args, {
    "--": true,
    string: [
      "-worktree",
    ],
    boolean: true,
    ...(options ?? {}),
  });

  // It seems all aliases remains in parsed so remove
  const aliases = Object.keys(options?.alias ?? {});
  for (const alias of aliases) {
    if (parsed[alias]) {
      delete parsed[alias];
    }
  }

  // Check if unknown options are specified
  knowns = [...knowns, "_", "--", "-worktree"];
  Object.keys(parsed).forEach((k) => {
    if (!knowns.includes(k)) {
      throw new Error(`Unknown option '${k}' is specified.`);
    }
  });
  return parsed;
}
