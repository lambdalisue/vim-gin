import { decodeUtf8 } from "../util/text.ts";

export type RunOptions = Omit<Deno.RunOptions, "cmd"> & {
  noOptionalLocks?: boolean;
  printCommand?: boolean;
};

export function run(args: string[], options: RunOptions = {}): Deno.Process {
  const cmd = ["git", "--no-pager", "--literal-pathspecs"];
  if (options.noOptionalLocks) {
    cmd.push("--no-optional-locks");
  }
  cmd.push(...args);
  if (options.printCommand) {
    console.debug(`Run '${cmd.join(" ")}' on '${options.cwd}'`);
  }
  return Deno.run({
    cmd,
    stdout: options.stdout,
    stderr: options.stderr,
    cwd: options.cwd,
    env: options.env,
  });
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
  const [status, stdout, stderr] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();
  if (!status.success) {
    throw new ExecuteError(args, status.code, stdout, stderr);
  }
  return stdout;
}
