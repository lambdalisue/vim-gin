import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.0/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.0.0/option/mod.ts";
import { decodeUtf8 } from "../util/text.ts";
import { removeAnsiEscapeCode } from "../util/ansi_escape_code.ts";
import { findWorktreeFromDenops } from "./worktree.ts";
import { run } from "./process.ts";

export class ExecuteError extends Error {
  constructor(message?: string) {
    super(message);

    Object.defineProperty(this, "name", {
      configurable: true,
      enumerable: false,
      value: this.constructor.name,
      writable: true,
    });

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ExecuteError);
    }
  }
}

export type ExecuteOptions = {
  worktree?: string;
  throwOnError?: boolean;
  processor?: string[];
};

export type ExecuteResult = {
  success: boolean;
  stdout: Uint8Array;
  stderr: Uint8Array;
};

export async function execute(
  denops: Denops,
  args: string[],
  options: ExecuteOptions = {},
): Promise<ExecuteResult> {
  const [env, verbose] = await batch.collect(
    denops,
    (denops) => [
      fn.environ(denops) as Promise<Record<string, string>>,
      option.verbose.get(denops),
    ],
  );

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  const proc = run(args, {
    printCommand: !!verbose,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    noOptionalLocks: true,
    cwd: worktree,
    env,
  });

  const { code, stdout, stderr } = await proc.output();

  // Early return when execution has failed
  if (code) {
    if (options.throwOnError) {
      throw new ExecuteError(removeAnsiEscapeCode(decodeUtf8(stderr)));
    }
    return { success: !!code, stdout, stderr };
  }

  // Return when no post-processor is specified
  const processor = options.processor ?? [];
  if (!processor.length) {
    return { success: !!code, stdout, stderr };
  }

  // Run post-processor
  const postResult = await postProcessor(processor, worktree, stdout, env);

  if (options.throwOnError && !postResult.code) {
    throw new ExecuteError(removeAnsiEscapeCode(decodeUtf8(postResult.stderr)));
  }

  return {
    success: !!postResult.code,
    stdout: postResult.stdout,
    stderr: postResult.stderr,
  };
}

async function postProcessor(
  processor: string[],
  worktree: string,
  stdout: Uint8Array,
  env: Deno.CommandOptions["env"],
) {
  const [cmd, ...args] = processor;
  const command = new Deno.Command(cmd, {
    args,
    stdin: "piped",
    stdout: "piped",
    stderr: "piped",
    cwd: worktree,
    env,
  });
  const proc = command.spawn();
  const reader = new Blob([stdout]);
  const [result, _] = await Promise.all([
    proc.output(),
    reader.stream().pipeTo(proc.stdin),
  ]);
  return result;
}
