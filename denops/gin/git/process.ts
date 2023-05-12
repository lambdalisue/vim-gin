import { decodeUtf8 } from "../util/text.ts";

export type RunOptions = Omit<Deno.CommandOptions, "cmd"> & {
  noOptionalLocks?: boolean;
  printCommand?: boolean;
};

export function run(
  args: string[],
  options: RunOptions = {},
): Deno.ChildProcess {
  args.unshift("--no-pager", "--literal-pathspecs");
  if (options.noOptionalLocks) {
    args.unshift("--no-optional-locks");
  }
  if (options.printCommand) {
    console.debug(`Run 'git ${args.join(" ")}' on '${options.cwd}'`);
  }
  const command = new Deno.Command("git", {
    args,
    stdout: options.stdout,
    stderr: options.stderr,
    cwd: options.cwd,
    env: options.env,
  });
  return command.spawn();
}

export class ExecuteError extends Error {
  constructor(
    public args: string[],
    public code: number,
    public stdout: Uint8Array,
    public stderr: Uint8Array,
  ) {
    super(`[${code}]: ${decodeUtf8(stderr)}`);
    this.name = "ExecuteError";
  }
}

export async function execute(
  args: string[],
  options: RunOptions = {},
): Promise<Uint8Array> {
  const proc = run(args, {
    ...options,
    stdout: "piped",
    stderr: "piped",
  });
  const { code, stdout, stderr } = await proc.output();
  if (code) {
    throw new ExecuteError(args, code, stdout, stderr);
  }
  return stdout;
}
