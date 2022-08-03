import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.7.1/helper/mod.ts";
import {
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.7.1/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { removeAnsiEscapeCode } from "../../util/ansi_escape_code.ts";
import { exec as bareExec } from "../bare.ts";

export type Options = {
  worktree?: string;
  fileformat?: string;
  encoding?: string;
};

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "ff",
    "fileformat",
    "enc",
    "encoding",
  ]);
  const options = {
    worktree: opts["worktree"],
    fileformat: opts["ff"] ?? opts["fileformat"],
    encoding: opts["enc"] ?? opts["encoding"],
  };
  await exec(denops, residue, options);
}

export async function exec(
  denops: Denops,
  args: string[],
  options: Options = {},
): Promise<void> {
  const { status, stdout, stderr } = await bareExec(denops, args, options);
  const result = new Uint8Array([...stdout, ...stderr]);
  const decoder = new TextDecoder(options.encoding ?? "utf8");
  const decoded = decoder.decode(result);
  const text = decoded.split(getSeparator(options.fileformat)).join("\n");
  if (status.success) {
    await helper.echo(
      denops,
      removeAnsiEscapeCode(text),
    );
  } else {
    await helper.echoerr(
      denops,
      removeAnsiEscapeCode(text),
    );
  }
}

function getSeparator(fileformat: string | undefined): RegExp {
  switch (fileformat) {
    case "dos":
      return /\r\n/g;
    case "unix":
      return /\n/g;
    case "mac":
      return /\r/g;
    default:
      return /\r?\n/g;
  }
}
