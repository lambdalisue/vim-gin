import type { Denops } from "https://deno.land/x/denops_std@v3.2.0/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.2.0/autocmd/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.2.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.2.0/function/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import {
  assertFileFormat,
  findFileFormat,
  isFileFormat,
  maybeFileFormat,
  splitText,
} from "./fileformat.ts";
import { tryDecode } from "./fileencoding.ts";

export type OpenOptions = {
  mods?: string;
  cmdarg?: string;
};

/**
 * Open a buffer
 */
export async function open(
  denops: Denops,
  bufname: string,
  options: OpenOptions = {},
): Promise<void> {
  const mods = options.mods ?? "";
  const cmdarg = options.cmdarg ?? "";
  await denops.cmd(`${mods} edit ${cmdarg} \`=bufname\``, { bufname });
}

/**
 * Edit a buffer
 */
export async function reload(denops: Denops, bufnr: number): Promise<void> {
  await denops.cmd(
    "call timer_start(0, { -> gin#internal#util#buffer#reload(bufnr) })",
    {
      bufnr,
    },
  );
}

/**
 * Replace the buffer content
 */
export async function replace(
  denops: Denops,
  bufnr: number,
  repl: string[],
): Promise<void> {
  await denops.call("gin#internal#util#buffer#replace", bufnr, repl);
}

export type AssignOptions = {
  fileformat?: string;
  fileencoding?: string;
  preprocessor?: (repl: string[]) => string[];
};

/**
 * Assign content to the buffer with given format and encoding.
 */
export async function assign(
  denops: Denops,
  bufnr: number,
  content: Uint8Array,
  options: AssignOptions = {},
): Promise<void> {
  const [fileformat, fileformatsStr, fileencodingsStr] = await batch.gather(
    denops,
    async (denops) => {
      await fn.getbufvar(denops, bufnr, "&fileformat");
      await fn.getbufvar(denops, bufnr, "&fileformats");
      await fn.getbufvar(denops, bufnr, "&fileencodings");
    },
  );
  assertFileFormat(fileformat);
  unknownutil.assertString(fileformatsStr);
  unknownutil.assertString(fileencodingsStr);
  const fileformats = fileformatsStr.split(",");
  const fileencodings = fileencodingsStr.split(",");
  unknownutil.assertArray(fileformats, isFileFormat);
  unknownutil.assertArray(fileencodings, unknownutil.isString);
  let enc: string;
  let text: string;
  if (options.fileencoding) {
    enc = options.fileencoding;
    text = (new TextDecoder(enc)).decode(content);
  } else {
    [enc, text] = tryDecode(content, fileencodings);
  }
  const ff = maybeFileFormat(options.fileformat) ??
    findFileFormat(text, fileformats) ?? fileformat;
  const preprocessor = options.preprocessor ?? ((v: string[]) => v);
  const repl = preprocessor(splitText(text, ff));
  await batch.batch(denops, async (denops) => {
    await fn.setbufvar(denops, bufnr, "&fileformat", ff);
    await fn.setbufvar(denops, bufnr, "&fileencoding", enc);
    await replace(denops, bufnr, repl);
  });
}

/**
 * Concrete the buffer.
 *
 * - The `buftype` option become "nofile"
 * - The `swapfile` become disabled
 * - The `modifiable` become disabled
 * - The content of the buffer is restored on `BufReadCmd` synchronously
 */
export async function concrete(
  denops: Denops,
  bufnr: number,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await autocmd.group(
      denops,
      "gin_internal_util_buffer_concrete",
      (helper) => {
        const pat = `<buffer=${bufnr}>`;
        helper.remove("*", pat);
        helper.define(
          "BufWriteCmd",
          pat,
          "call gin#internal#util#buffer#concreate_store()",
        );
        helper.define(
          "BufReadCmd",
          pat,
          "call gin#internal#util#buffer#concreate_restore()",
          {
            nested: true,
          },
        );
      },
    );
    await denops.call("gin#internal#util#buffer#concreate_store");
  });
}

/**
 * Ensure the executor is executed under the specified buffer
 */
export async function ensure<T = void>(
  denops: Denops,
  bufnr: number,
  executor: () => Promise<T>,
): Promise<T> {
  const [bufnrCur, winidCur, winidNext] = await batch.gather(
    denops,
    async (denops) => {
      await fn.bufnr(denops);
      await fn.win_getid(denops);
      await fn.bufwinid(denops, bufnr);
    },
  );
  unknownutil.assertNumber(bufnrCur);
  unknownutil.assertNumber(winidCur);
  unknownutil.assertNumber(winidNext);
  if (winidCur === winidNext) {
    return executor();
  }
  if (winidNext === -1) {
    await denops.cmd(`keepjumps keepalt ${bufnr}buffer`);
    try {
      return await executor();
    } finally {
      await denops.cmd(`keepjumps keepalt ${bufnrCur}buffer`);
    }
  } else {
    await fn.win_gotoid(denops, winidNext);
    try {
      return await executor();
    } finally {
      await fn.win_gotoid(denops, winidCur);
    }
  }
}

/**
 * Ensure the executor is executed under a modifiable buffer
 */
export async function modifiable<T = void>(
  denops: Denops,
  bufnr: number,
  executor: () => Promise<T>,
): Promise<T> {
  const [modified, modifiable, foldmethod] = await batch.gather(
    denops,
    async (denops) => {
      await fn.getbufvar(denops, bufnr, "&modified");
      await fn.getbufvar(denops, bufnr, "&modifiable");
      await fn.getbufvar(denops, bufnr, "&foldmethod");
    },
  );
  unknownutil.assertNumber(modified);
  unknownutil.assertNumber(modifiable);
  unknownutil.assertString(foldmethod);
  await batch.batch(denops, async (denops) => {
    await fn.setbufvar(denops, bufnr, "&modifiable", 1);
    await fn.setbufvar(denops, bufnr, "&foldmethod", "manual");
  });
  try {
    return await executor();
  } finally {
    await batch.batch(denops, async (denops) => {
      await fn.setbufvar(denops, bufnr, "&modified", modified);
      await fn.setbufvar(denops, bufnr, "&modifiable", modifiable);
      await fn.setbufvar(denops, bufnr, "&foldmethod", foldmethod);
    });
  }
}
