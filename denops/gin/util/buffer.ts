import { autocmd, batch, Denops, fn } from "../deps.ts";

/**
 * Open a buffer
 */
export async function open(denops: Denops, bufname: string): Promise<void> {
  await denops.cmd("edit `=bufname`", { bufname });
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
  ) as [number, number, number];
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
  ) as [number, number, string];
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

export type ReadFileOptions = {
  silent?: boolean;
  keepalt?: boolean;
  keepjumps?: boolean;
  lockmarks?: boolean;
  line?: number;
  fileformat?: "dos" | "unix" | "mac";
  encoding?: string;
  binary?: boolean;
  nobinary?: boolean;
  bad?: string;
  edit?: boolean;
};

async function readFileInternal(
  denops: Denops,
  file: string,
  options: ReadFileOptions = {},
): Promise<void> {
  const pre = [
    ...(options.silent ? ["silent"] : []),
    ...(options.keepalt ? ["keepalt"] : []),
    ...(options.keepjumps ? ["keepjumps"] : []),
    ...(options.lockmarks ? ["lockmarks"] : []),
  ].filter((v) => v).join(" ");
  const line = options.line ?? "";
  const opt = [
    ...(options.fileformat ? [`++ff=${options.fileformat}`] : []),
    ...(options.encoding ? [`++enc=${options.encoding}`] : []),
    ...(options.binary ? ["++bin"] : []),
    ...(options.nobinary ? ["++nobin"] : []),
    ...(options.bad ? [`++bad=${options.bad}`] : []),
    ...(options.edit ? ["++edit"] : []),
  ].filter((v) => v).join(" ");
  if (denops.meta.host === "vim") {
    // NOTE:
    // It seems Vim slightly changed behaviors of `read` on empty buffer
    // thus we need to overwrite the firstline to make sure that the buffer
    // ends with a newline
    await denops.cmd("call setline(1, getline(1))");
  }
  await denops.cmd(`execute '${pre} ${line}read ${opt}' fnameescape(file)`, {
    file,
  });
}

/**
 * Read file content into the current buffer
 */
export async function readFile(
  denops: Denops,
  file: string,
  options: ReadFileOptions = {},
): Promise<void> {
  const bufnr = await fn.bufnr(denops);
  return await modifiable(
    denops,
    bufnr,
    () => readFileInternal(denops, file, options),
  );
}

/**
 * Read data into the current buffer through a temporary file
 */
export async function readData(
  denops: Denops,
  data: Uint8Array,
  options: ReadFileOptions = {},
): Promise<void> {
  const f = await Deno.makeTempFile();
  await Deno.writeFile(f, data);
  try {
    await readFile(denops, f, options);
  } finally {
    await Deno.remove(f);
  }
}

export type EditFileOptions = Omit<ReadFileOptions, "edit">;

/**
 * Read file content and replace the current buffer with it
 */
export async function editFile(
  denops: Denops,
  file: string,
  options: EditFileOptions = {},
): Promise<void> {
  const bufnr = await fn.bufnr(denops);
  const pre = [
    ...(options.silent ? ["silent"] : []),
    ...(options.keepalt ? ["keepalt"] : []),
    ...(options.keepjumps ? ["keepjumps"] : []),
    ...(options.lockmarks ? ["lockmarks"] : []),
  ].filter((v) => v).join(" ");
  await modifiable(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd(`${pre} %delete _`);
      await readFileInternal(denops, file, { ...options, edit: true });
      await denops.cmd(`${pre} 1delete _`);
    });
  });
}

/**
 * Read  and replace the current buffer with it
 */
export async function editData(
  denops: Denops,
  data: Uint8Array,
  options: EditFileOptions = {},
): Promise<void> {
  const f = await Deno.makeTempFile();
  await Deno.writeFile(f, data);
  try {
    await editFile(denops, f, options);
  } finally {
    await Deno.remove(f);
  }
}
