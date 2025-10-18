import type { Denops } from "jsr:@denops/std@^7.0.0";
import { emojify } from "jsr:@lambdalisue/github-emoji@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { parseOpts, validateOpts } from "jsr:@denops/std@^7.0.0/argument";
import {
  format as formatBufname,
  parse as parseBufname,
} from "jsr:@denops/std@^7.0.0/bufname";
import { execute } from "../../git/executor.ts";
import {
  type GitBlameLine,
  type GitBlameResult,
  type GitCommit,
  parseGitBlamePorcelain,
} from "./parser.ts";
import { relativeTime } from "../../util/relative_time.ts";
import type { ExecOptions } from "./types.ts";
import * as History from "./history.ts";
import { getBlameContext, getBlameLine } from "./buffer_utils.ts";

/**
 * Initialize ginblame buffer when opened via BufReadCmd
 * This is the entry point for the ginblame:// scheme
 */
export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = (await vars.v.get(denops, "cmdarg")) as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, ["enc", "encoding", "ff", "fileformat", "emojify"]);
  const { scheme, expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  await exec(denops, bufnr, fragment, {
    worktree: expr,
    commitish: unnullish(
      params?.commitish,
      (v) => ensure(v, is.String, { message: "commitish must be string" }),
    ),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

/**
 * Initialize ginblamenav buffer when opened via BufReadCmd
 * This is the entry point for the ginblamenav:// scheme
 * Reloads the blame view when navigating history
 */
export async function editNav(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  // Parse the ginblamenav buffer name to extract parameters
  const { expr, params } = parseBufname(bufname);

  // Try to get the file fragment from the nav buffer variable
  const fileFragment = await vars.b.get(denops, "gin_blame_file_fragment") as
    | string
    | undefined;

  if (!fileFragment) {
    // This shouldn't happen in normal usage, but handle it gracefully
    throw new Error("Cannot reload ginblamenav: file fragment not found");
  }

  // Get the associated ginblame buffer name
  const bufnameBlame = await vars.b.get(denops, "gin_blame_file_bufname") as
    | string
    | undefined;
  if (!bufnameBlame) {
    throw new Error(
      "Cannot reload ginblamenav: associated ginblame buffer not found",
    );
  }

  // Get cmdarg for encoding/fileformat options
  const cmdarg = (await vars.v.get(denops, "cmdarg")) as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, ["enc", "encoding", "ff", "fileformat"]);

  // Get or create the ginblame buffer
  let bufnrBlame = await fn.bufnr(denops, bufnameBlame);
  let winidBlame = await fn.bufwinid(denops, bufnrBlame);

  // If the ginblame buffer doesn't exist, we need to create it
  if (bufnrBlame === -1) {
    // Open the ginblame buffer in the appropriate window
    const winidNav = await fn.bufwinid(denops, bufnr);

    // Temporarily disable winfixbuf for the nav window to switch windows
    if (winidNav !== -1) {
      await fn.setwinvar(denops, winidNav, "&winfixbuf", 0);
    }

    try {
      // Move to the blame window position (right side)
      await denops.cmd("wincmd l");
      // Load the buffer
      await buffer.open(denops, bufnameBlame, {
        opener: "edit",
      });
      bufnrBlame = await fn.bufnr(denops, bufnameBlame);
      winidBlame = await fn.bufwinid(denops, bufnrBlame);

      // Return to the nav window
      await fn.win_gotoid(denops, winidNav);
    } finally {
      // Re-enable winfixbuf
      if (winidNav !== -1) {
        await fn.setwinvar(denops, winidNav, "&winfixbuf", 1);
      }
    }
  }

  // Temporarily disable winfixbuf in both windows to allow buffer reloading
  const winidNav = await fn.bufwinid(denops, bufnr);

  await batch.batch(denops, async (denops) => {
    if (winidNav !== -1) {
      await fn.setwinvar(denops, winidNav, "&winfixbuf", 0);
    }
    if (winidBlame !== -1) {
      await fn.setwinvar(denops, winidBlame, "&winfixbuf", 0);
    }
  });

  try {
    // Re-execute the blame command to reload both buffers
    await exec(denops, bufnrBlame, fileFragment, {
      worktree: expr,
      commitish: unnullish(
        params?.commitish,
        (v) => ensure(v, is.String, { message: "commitish must be string" }),
      ),
      encoding: opts.enc ?? opts.encoding,
      fileformat: opts.ff ?? opts.fileformat,
      emojify: "emojify" in (params ?? {}),
    });
  } finally {
    // Re-enable winfixbuf in both windows after reloading
    await batch.batch(denops, async (denops) => {
      if (winidNav !== -1) {
        await fn.setwinvar(denops, winidNav, "&winfixbuf", 1);
      }
      if (winidBlame !== -1) {
        await fn.setwinvar(denops, winidBlame, "&winfixbuf", 1);
      }
    });
  }
}

/**
 * Execute git blame and set up the 3-window layout
 *
 * Creates three synchronized buffers:
 * - ginblame: Shows file content with commit dividers (top: detail, bottom-right)
 * - ginblamenav: Shows line numbers and commit info (bottom-left, 60 cols)
 * - ginblamedetail: Shows full commit details (top, 10 lines)
 *
 * Features:
 * - scrollbind/cursorbind: Keeps nav and blame in sync
 * - CursorMoved: Updates detail when cursor moves to different commit
 * - Enter/<C-O>/<C-I>: Navigate between commits with history
 * - File rename tracking: Follows file renames across commits
 */
export async function exec(
  denops: Denops,
  bufnr: number,
  relpath: string,
  options: ExecOptions,
): Promise<void> {
  const filename = relpath.replaceAll("\\", "/");
  const args = [
    "blame",
    options.commitish ?? "HEAD",
    "--porcelain",
    "--",
    filename,
  ];
  const { stdout } = await execute(denops, args, {
    worktree: options.worktree,
    throwOnError: true,
    stdoutIndicator: "null",
  });
  const { content, fileformat, fileencoding } = await buffer.decode(
    denops,
    bufnr,
    stdout,
    {
      fileformat: options.fileformat,
      fileencoding: options.encoding,
    },
  );
  const blameResult = parseGitBlamePorcelain(content);
  const { fileContent, navContent, dividers, lineMap, fileLineToPhysical } =
    formatGitBlameResult(
      blameResult,
      options.emojify,
    );

  // Prepare buffer names for paired buffers
  const bufnameNav = formatBufname({
    scheme: "ginblamenav",
    expr: options.worktree,
    params: {
      commitish: options.commitish,
      ...(options.emojify ? { emojify: "" } : {}),
    },
    fragment: relpath,
  });
  const bufnameFile = formatBufname({
    scheme: "ginblame",
    expr: options.worktree,
    params: {
      commitish: options.commitish,
      ...(options.emojify ? { emojify: "" } : {}),
    },
    fragment: relpath,
  });
  const bufnameDetail = formatBufname({
    scheme: "ginblamedetail",
    expr: options.worktree,
    params: {
      commitish: options.commitish,
      ...(options.emojify ? { emojify: "" } : {}),
    },
    fragment: relpath,
  });

  await buffer.replace(denops, bufnr, fileContent, {
    fileformat,
    fileencoding,
  });
  await buffer.concrete(denops, bufnr);
  await buffer.ensure(denops, bufnr, async () => {
    // Detect filetype first to get the actual file type (outside batch)
    await denops.cmd("filetype detect");
    const detectedFiletype = await option.filetype.getLocal(denops);
    // Set compound filetype: <detected>.gin-blame
    if (detectedFiletype) {
      await option.filetype.setLocal(denops, `${detectedFiletype}.gin-blame`);
    } else {
      await option.filetype.setLocal(denops, "gin-blame");
    }

    await batch.batch(denops, async (denops) => {
      await option.scrollbind.setLocal(denops, true);
      await option.cursorbind.setLocal(denops, true);
      await option.cursorline.setLocal(denops, true);
      await option.signcolumn.setLocal(denops, "no");
      await option.number.setLocal(denops, false);
      await option.relativenumber.setLocal(denops, false);
      await option.wrap.setLocal(denops, false);
      await option.swapfile.setLocal(denops, false);
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nowrite");
      await option.modifiable.setLocal(denops, false);
      await vars.b.set(denops, "gin_blame_result", blameResult);
      await vars.b.set(denops, "gin_blame_line_map", lineMap);
      await vars.b.set(
        denops,
        "gin_blame_file_line_to_physical",
        fileLineToPhysical,
      );
      await vars.b.set(denops, "gin_blame_nav_bufname", bufnameNav);
      await vars.b.set(denops, "gin_blame_detail_bufname", bufnameDetail);
      await vars.b.set(denops, "gin_blame_file_fragment", relpath);
      // Setup autocmd to update commit detail on cursor move
      await denops.cmd(
        `autocmd CursorMoved <buffer> call denops#request('gin', 'blame:update_detail', [])`,
      );
      await fn.sign_unplace(denops, "*", { buffer: bufnr });
      await fn.sign_placelist(
        denops,
        dividers.map((divider) => ({
          id: divider,
          name: "GinBlameDividerSign",
          buffer: bufnr,
          lnum: divider,
        })),
      );
      // Close all paired buffers when this buffer is unloaded
      await denops.cmd(
        `autocmd BufUnload <buffer> ++once call timer_start(0, { -> execute('silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_nav') . ' | silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_detail')) })`,
      );
    });
  });

  // Create layout: top commit detail (10 lines), bottom nav/blame split
  const winidNav = await fn.bufwinid(denops, bufnameNav);
  if (winidNav === -1) {
    // Create 3-window layout
    // First, create top detail window
    await buffer.open(denops, bufnameDetail, {
      opener: "topleft 10split",
    });

    // Then create bottom nav window
    await denops.cmd("wincmd j");
    await buffer.open(denops, bufnameNav, {
      opener: "leftabove 60vsplit",
    });
  } else {
    await fn.win_gotoid(denops, winidNav);
  }
  const bufnrNav = await fn.bufnr(denops, bufnameNav);
  const bufnrDetail = await fn.bufnr(denops, bufnameDetail);

  // Store buffer numbers in ginblame buffer for cleanup autocmd
  await fn.setbufvar(denops, bufnr, "gin_blame_paired_bufnr_nav", bufnrNav);
  await fn.setbufvar(
    denops,
    bufnr,
    "gin_blame_paired_bufnr_detail",
    bufnrDetail,
  );

  await buffer.replace(denops, bufnrNav, navContent, {
    fileformat,
    fileencoding,
  });
  await buffer.concrete(denops, bufnrNav);
  await buffer.ensure(denops, bufnrNav, async () => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("setfiletype gin-blame-nav");
      await option.scrollbind.setLocal(denops, true);
      await option.cursorbind.setLocal(denops, true);
      await option.cursorline.setLocal(denops, true);
      await option.winfixwidth.setLocal(denops, true);
      await option.wrap.setLocal(denops, false);
      await option.number.setLocal(denops, false);
      await option.relativenumber.setLocal(denops, false);
      await option.signcolumn.setLocal(denops, "no");
      await option.swapfile.setLocal(denops, false);
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nowrite");
      await option.modifiable.setLocal(denops, false);
      await vars.b.set(denops, "gin_blame_result", blameResult);
      await vars.b.set(denops, "gin_blame_line_map", lineMap);
      await vars.b.set(
        denops,
        "gin_blame_file_line_to_physical",
        fileLineToPhysical,
      );
      await vars.b.set(denops, "gin_blame_file_bufname", bufnameFile);
      await vars.b.set(denops, "gin_blame_file_fragment", relpath);
      await vars.b.set(denops, "gin_blame_detail_bufname", bufnameDetail);
      // Store buffer numbers for cleanup
      await vars.b.set(denops, "gin_blame_paired_bufnr_file", bufnr);
      await vars.b.set(denops, "gin_blame_paired_bufnr_detail", bufnrDetail);
      // Initialize history as empty - will be populated on first Enter
      await vars.b.set(denops, "gin_blame_history", []);
      await vars.b.set(denops, "gin_blame_history_index", -1);
      // Setup autocmd to update commit detail on cursor move
      await denops.cmd(
        `autocmd CursorMoved <buffer> call denops#request('gin', 'blame:update_detail', [])`,
      );
      await fn.sign_unplace(denops, "*", { buffer: bufnrNav });
      await fn.sign_placelist(
        denops,
        dividers.map((divider) => ({
          id: divider,
          name: "GinBlameDividerSign",
          buffer: bufnrNav,
          lnum: divider,
        })),
      );
      // Close all paired buffers when this navigation buffer is unloaded
      await denops.cmd(
        `autocmd BufUnload <buffer> ++once call timer_start(0, { -> execute('silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_file') . ' | silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_detail')) })`,
      );
    });
  });

  // Setup commit detail buffer
  // Initial commit detail will be set by the first CursorMoved event
  await buffer.ensure(denops, bufnrDetail, async () => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("setfiletype git");
      await option.winfixheight.setLocal(denops, true);
      await option.wrap.setLocal(denops, false);
      await option.number.setLocal(denops, false);
      await option.relativenumber.setLocal(denops, false);
      await option.signcolumn.setLocal(denops, "no");
      await option.swapfile.setLocal(denops, false);
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nowrite");
      await option.modifiable.setLocal(denops, false);
      // Store buffer numbers for cleanup
      await vars.b.set(denops, "gin_blame_paired_bufnr_file", bufnr);
      await vars.b.set(denops, "gin_blame_paired_bufnr_nav", bufnrNav);
      // Close all paired buffers when detail buffer is unloaded
      await denops.cmd(
        `autocmd BufUnload <buffer> ++once call timer_start(0, { -> execute('silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_file') . ' | silent! bwipeout ' . getbufvar(str2nr(expand('<abuf>')), 'gin_blame_paired_bufnr_nav')) })`,
      );
    });
  });

  // Trigger initial commit detail update
  await fn.win_gotoid(denops, await fn.bufwinid(denops, bufnrNav));
  await denops.call("denops#request", "gin", "blame:update_detail", []);
}

/**
 * Format git blame result into display content
 *
 * Creates three synchronized structures:
 * - fileContent: Actual file lines with empty dividers between commits
 * - navContent: Line numbers and commit info (summary, author, time)
 * - dividers: Physical line numbers where commit boundaries occur
 * - lineMap: Physical line → GitBlameLine mapping for O(1) lookup
 * - fileLineToPhysical: File line number → Physical line mapping for cursor navigation
 *
 * Structure example:
 *   Physical Line | fileContent    | navContent
 *   1             | ""             | ""
 *   2             | "function..." | "1 2 days ago  Author  feat: add..."
 *   3             | "  return..." | "2"
 *   4             | ""             | ""
 *   5             | "const x..."   | "3 1 week ago  Author  fix: update..."
 */
function formatGitBlameResult(
  result: GitBlameResult,
  shouldEmojify?: boolean,
): {
  fileContent: string[];
  navContent: string[];
  dividers: number[];
  lineMap: Record<number, GitBlameLine>;
  fileLineToPhysical: Record<number, number>;
} {
  const { commits, lines } = result;
  const fileContent: string[] = [];
  const navContent: string[] = [];
  const dividers: number[] = [];
  const lineMap: Record<number, GitBlameLine> = {};
  const fileLineToPhysical: Record<number, number> = {};

  let lineNumber = 1;
  let offset = 1;
  let previousCommitSha: string | undefined;

  const maxLineNumberLength = lines.at(-1)?.lineNumber.toString().length ?? 1;

  for (const line of lines) {
    if (previousCommitSha !== line.commitSha) {
      previousCommitSha = line.commitSha;
      fileContent.push("");
      navContent.push("");
      navContent.push(
        `${lineNumber.toString().padStart(maxLineNumberLength)} ${
          formatNavLine(line, commits, shouldEmojify)
        }`,
      );
      dividers.push(offset);
      offset += 2;
    } else {
      offset += 1;
      navContent.push(`${lineNumber.toString().padStart(maxLineNumberLength)}`);
    }
    fileContent.push(line.content);
    // Map physical line to blame line
    const physicalLine = fileContent.length;
    lineMap[physicalLine] = line;
    // Create reverse map: file line number -> physical line
    fileLineToPhysical[line.lineNumber] = physicalLine;
    lineNumber += 1;
  }
  return { fileContent, navContent, dividers, lineMap, fileLineToPhysical };
}

function formatNavLine(
  line: GitBlameLine,
  commits: Record<string, GitCommit>,
  shouldEmojify?: boolean,
): string {
  const commit = commits[line.commitSha];
  const author = commit.author;
  const reltime = relativeTime(author.time);
  const summary = shouldEmojify ? emojify(commit.summary) : commit.summary;
  return `${reltime}\t${commit.author.name}\t${summary}`;
}

// Export updateDetail from detail.ts
export { updateDetail } from "./detail.ts";

/**
 * Update blame buffers with a new commit
 *
 * This is a complex operation that:
 * 1. Executes git blame for the new commit
 * 2. Updates buffer content
 * 3. Renames buffers to include new commitish (may create new buffer numbers)
 * 4. Updates all buffer variables (lineMap, fileLineToPhysical, etc.)
 * 5. Switches windows to new buffers if buffer numbers changed
 * 6. Deletes old buffers
 *
 * IMPORTANT: nvim_buf_set_name may create a new buffer instead of renaming.
 * We must:
 * - Get the new buffer number after rename
 * - Set variables on the NEW buffer
 * - Switch windows to the NEW buffer
 * - Delete the OLD buffer (after variables are copied)
 *
 * @returns New buffer numbers (may differ from input if rename created new buffers)
 */
async function updateBlameBuffers(
  denops: Denops,
  bufnrNav: number,
  bufnrBlame: number,
  fileFragment: string,
  expr: string,
  newCommitish: string,
  emojify: boolean,
): Promise<{ newBufnrNav: number; newBufnrBlame: number }> {
  // Execute git blame with new commitish
  const filename = fileFragment.replaceAll("\\", "/");
  const args = [
    "blame",
    newCommitish,
    "--porcelain",
    "--",
    filename,
  ];
  const { stdout } = await execute(denops, args, {
    worktree: expr,
    throwOnError: true,
    stdoutIndicator: "null",
  });

  const { content, fileformat, fileencoding } = await buffer.decode(
    denops,
    bufnrBlame,
    stdout,
    {},
  );
  const newBlameResult = parseGitBlamePorcelain(content);
  const { fileContent, navContent, dividers, lineMap, fileLineToPhysical } =
    formatGitBlameResult(
      newBlameResult,
      emojify,
    );

  // Prepare new buffer names with commitish
  const newBufnameBlame = formatBufname({
    scheme: "ginblame",
    expr: expr,
    params: {
      commitish: newCommitish,
      ...(emojify ? { emojify: "" } : {}),
    },
    fragment: fileFragment,
  });
  const newBufnameNav = formatBufname({
    scheme: "ginblamenav",
    expr: expr,
    params: {
      commitish: newCommitish,
      ...(emojify ? { emojify: "" } : {}),
    },
    fragment: fileFragment,
  });

  // Get window IDs
  const winidNav = await fn.bufwinid(denops, bufnrNav);
  const winidBlame = await fn.bufwinid(denops, bufnrBlame);

  // Temporarily disable winfixbuf in both windows
  await batch.batch(denops, async (denops) => {
    if (winidNav !== -1) {
      await fn.setwinvar(denops, winidNav, "&winfixbuf", 0);
    }
    if (winidBlame !== -1) {
      await fn.setwinvar(denops, winidBlame, "&winfixbuf", 0);
    }
  });

  try {
    // Update ginblame buffer content
    await buffer.replace(denops, bufnrBlame, fileContent, {
      fileformat,
      fileencoding,
    });

    // Rename ginblame buffer using :file command (Vim/Neovim compatible)
    const escapedBlame = await fn.fnameescape(denops, newBufnameBlame);
    await fn.win_execute(denops, winidBlame, `noautocmd file ${escapedBlame}`);

    // Get detail bufname before batch (to avoid issues with vars.b.get in batch)
    const detailBufname = await vars.b.get(
      denops,
      "gin_blame_detail_bufname",
    ) as string | undefined;

    // Update ginblame buffer variables and signs (use the actual buffer number)
    await batch.batch(denops, async (denops) => {
      await fn.setbufvar(
        denops,
        bufnrBlame,
        "gin_blame_result",
        newBlameResult,
      );
      await fn.setbufvar(denops, bufnrBlame, "gin_blame_line_map", lineMap);
      await fn.setbufvar(
        denops,
        bufnrBlame,
        "gin_blame_file_line_to_physical",
        fileLineToPhysical,
      );
      await fn.setbufvar(
        denops,
        bufnrBlame,
        "gin_blame_file_fragment",
        fileFragment,
      );
      await fn.setbufvar(
        denops,
        bufnrBlame,
        "gin_blame_file_bufname",
        newBufnameBlame,
      );
      await fn.setbufvar(
        denops,
        bufnrBlame,
        "gin_blame_nav_bufname",
        newBufnameNav,
      );
      if (detailBufname) {
        await fn.setbufvar(
          denops,
          bufnrBlame,
          "gin_blame_detail_bufname",
          detailBufname,
        );
      }
      await fn.sign_unplace(denops, "*", { buffer: bufnrBlame });
      await fn.sign_placelist(
        denops,
        dividers.map((divider) => ({
          id: divider,
          name: "GinBlameDividerSign",
          buffer: bufnrBlame,
          lnum: divider,
        })),
      );
    });

    // Update ginblamenav buffer content
    await buffer.replace(denops, bufnrNav, navContent, {
      fileformat,
      fileencoding,
    });

    // Rename ginblamenav buffer using :file command (Vim/Neovim compatible)
    const escapedNav = await fn.fnameescape(denops, newBufnameNav);
    await fn.win_execute(denops, winidNav, `noautocmd file ${escapedNav}`);

    // Update ginblamenav buffer variables and signs
    await batch.batch(denops, async (denops) => {
      await fn.setbufvar(denops, bufnrNav, "gin_blame_result", newBlameResult);
      await fn.setbufvar(denops, bufnrNav, "gin_blame_line_map", lineMap);
      await fn.setbufvar(
        denops,
        bufnrNav,
        "gin_blame_file_line_to_physical",
        fileLineToPhysical,
      );
      await fn.setbufvar(
        denops,
        bufnrNav,
        "gin_blame_file_bufname",
        newBufnameBlame,
      );
      await fn.sign_unplace(denops, "*", { buffer: bufnrNav });
      await fn.sign_placelist(
        denops,
        dividers.map((divider) => ({
          id: divider,
          name: "GinBlameDividerSign",
          buffer: bufnrNav,
          lnum: divider,
        })),
      );
    });

    return { newBufnrNav: bufnrNav, newBufnrBlame: bufnrBlame };
  } finally {
    // Re-enable winfixbuf in both windows
    await batch.batch(denops, async (denops) => {
      if (winidNav !== -1) {
        await fn.setwinvar(denops, winidNav, "&winfixbuf", 1);
      }
      if (winidBlame !== -1) {
        await fn.setwinvar(denops, winidBlame, "&winfixbuf", 1);
      }
    });
  }
}

/**
 * Switch to the commit under cursor (bound to <CR>)
 *
 * Behavior:
 * - If already viewing the commit under cursor: Navigate to parent commit (commit^)
 * - Otherwise: Navigate to that commit
 *
 * Process:
 * 1. Get blame line info from current cursor position (works in both nav/blame buffers)
 * 2. Extract commitSha and originalLineNumber
 * 3. Check for file renames (use commit.previous.filename if going to parent)
 * 4. Update history with current position
 * 5. Execute git blame for new commit
 * 6. Find corresponding line in new commit using originalLineNumber
 * 7. Use fileLineToPhysical map to jump to correct physical line
 * 8. Explicitly set cursor in both nav and blame buffers (cursorbind is unreliable)
 *
 * Note: Works from both ginblame and ginblamenav buffers
 */
export async function switchToCommit(denops: Denops): Promise<void> {
  const winidCurrent = await fn.win_getid(denops);

  // Get blame buffer context
  const context = await getBlameContext(denops);
  let { bufnrNav, bufnrBlame } = context;
  const { scheme, expr, params, fileFragment, blameResult } = context;

  // Get blame line from current cursor position
  const lnum = await fn.line(denops, ".");
  const lineInfo = await getBlameLine(denops, scheme, lnum, blameResult);
  if (!lineInfo) {
    // Empty line or invalid position
    return;
  }

  const { blameLine } = lineInfo;
  const commitSha = blameLine.commitSha;
  const originalLineNum = blameLine.originalLineNumber;

  // Get the commit info to check for file rename
  const commit = blameResult.commits[commitSha];
  if (!commit) {
    throw new Error(`Commit ${commitSha} not found in blame result`);
  }

  // Validate that bufnrBlame is valid
  if (bufnrBlame === -1) {
    throw new Error("Ginblame buffer not found");
  }

  // Get history
  const { history, historyIndex } = await History.getHistory(denops);

  // Determine current and new commitish
  const currentCommitish = Array.isArray(params?.commitish)
    ? params.commitish[0]
    : (params?.commitish ?? "HEAD");

  // Check if we're already viewing this commit - if so, go to parent
  let newCommitish: string;
  let newFilename: string;
  if (currentCommitish === commitSha) {
    newCommitish = `${commitSha}^`;
    newFilename = commit.previous?.filename ?? fileFragment;
  } else {
    newCommitish = commitSha;
    newFilename = commit.filename;
  }

  // Update history with current position
  const { updatedHistory } = History.createHistoryUpdate(
    history,
    historyIndex,
    currentCommitish,
    lnum,
    fileFragment,
  );

  // Add new entry
  const { newHistory, newIndex } = History.addHistoryEntry(
    updatedHistory,
    newCommitish,
    newFilename,
  );

  // Save history BEFORE updating buffers
  await History.saveHistory(denops, bufnrNav, bufnrBlame, newHistory, newIndex);

  // Update buffers with NEW commit and new filename
  try {
    await updateBlameBuffers(
      denops,
      bufnrNav,
      bufnrBlame,
      newFilename,
      expr,
      newCommitish,
      "emojify" in (params ?? {}),
    );

    // Get actual buffer numbers after update (they may have changed due to rename)
    const newBufnameNav = formatBufname({
      scheme: "ginblamenav",
      expr: expr,
      params: {
        commitish: newCommitish,
        ...(("emojify" in (params ?? {})) ? { emojify: "" } : {}),
      },
      fragment: newFilename,
    });
    const newBufnameBlame = formatBufname({
      scheme: "ginblame",
      expr: expr,
      params: {
        commitish: newCommitish,
        ...(("emojify" in (params ?? {})) ? { emojify: "" } : {}),
      },
      fragment: newFilename,
    });

    const actualBufnrNav = await fn.bufnr(denops, newBufnameNav);
    const actualBufnrBlame = await fn.bufnr(denops, newBufnameBlame);

    // Update the file fragment in nav buffer variable if filename changed
    if (newFilename !== fileFragment) {
      await fn.setbufvar(
        denops,
        actualBufnrNav,
        "gin_blame_file_fragment",
        newFilename,
      );
    }

    // Update history with actual buffer numbers
    await History.saveHistory(
      denops,
      actualBufnrNav,
      actualBufnrBlame,
      newHistory,
      newIndex,
    );

    // Use actual buffer numbers for the rest of the function
    bufnrNav = actualBufnrNav;
    bufnrBlame = actualBufnrBlame;
  } catch (error) {
    // If the file doesn't exist in this commit, we've reached the beginning
    if (error instanceof Error && error.message.includes("no such path")) {
      await denops.cmd(
        'echohl WarningMsg | echo "File does not exist in this commit (reached the beginning)" | echohl None',
      );
      // Restore history to previous state
      await History.saveHistory(
        denops,
        bufnrNav,
        bufnrBlame,
        history,
        historyIndex,
      );
      return;
    }
    throw error;
  }

  // Move cursor to the corresponding line in the NEW buffer
  // The new buffer shows the selected commit, so we need to find the original line number
  // Get the updated blame result from the new buffer
  const newBlameResult = await vars.b.get(denops, "gin_blame_result") as
    | GitBlameResult
    | undefined;
  if (!newBlameResult) {
    throw new Error("Updated blame result not found");
  }

  // Find the line in the new commit where originalLineNumber matches
  // In the new commit, this originalLineNumber becomes the current lineNumber
  const newBlameLine = newBlameResult.lines.find((line) =>
    line.lineNumber === originalLineNum
  );

  if (newBlameLine) {
    // Move to nav buffer to search and update cursor
    const winidNav = await fn.bufwinid(denops, bufnrNav);
    if (winidNav !== -1) {
      await fn.win_gotoid(denops, winidNav);
    }

    // Get the new fileLineToPhysical map from the updated buffer
    const newFileLineToPhysical = await vars.b.get(
      denops,
      "gin_blame_file_line_to_physical",
    ) as Record<number, number> | undefined;

    // Direct lookup: file line number -> physical line
    let foundLine = 0;
    if (newFileLineToPhysical) {
      foundLine = newFileLineToPhysical[newBlameLine.lineNumber] || 0;
    }

    if (foundLine > 0) {
      await fn.cursor(denops, foundLine, 0);

      // IMPORTANT: Set cursor in both buffers explicitly
      // cursorbind is unreliable when switching buffers programmatically.
      // We must use win_execute to set cursor without changing current window.
      const winidBlame = await fn.bufwinid(denops, bufnrBlame);
      if (winidBlame !== -1) {
        await fn.win_execute(
          denops,
          winidBlame,
          `call cursor(${foundLine}, 0)`,
        );
      }

      // Update history with actual physical line after cursor move
      newHistory[newIndex].physicalLine = foundLine;
      await History.saveHistory(
        denops,
        bufnrNav,
        bufnrBlame,
        newHistory,
        newIndex,
      );
    }

    // Return to original window (ginblame if called from there)
    if (scheme === "ginblame") {
      await fn.win_gotoid(denops, winidCurrent);
    }
  }
}

/**
 * Navigate through blame history (bound to <C-O> and <C-I>)
 *
 * History management:
 * - Each history entry stores: commitish, physicalLine, filename
 * - physicalLine is the exact line number in the nav buffer at that commit
 * - When navigating back, we restore the exact cursor position (not file line)
 *
 * Process:
 * 1. Get history from buffer variables
 * 2. Calculate new history index (older: -1, newer: +1)
 * 3. Retrieve commitish and filename from history entry
 * 4. Execute git blame for that commit
 * 5. Restore cursor to the saved physicalLine
 * 6. Set cursor explicitly in both buffers (cursorbind is unreliable)
 *
 * Note: Works from both ginblame and ginblamenav buffers
 */
export async function navigateHistory(
  denops: Denops,
  direction: "older" | "newer",
): Promise<void> {
  const winidCurrent = await fn.win_getid(denops);

  // Get blame buffer context
  const context = await getBlameContext(denops);
  const { bufnrNav, bufnrBlame, scheme, expr, params, fileFragment } = context;

  // Get history
  const { history, historyIndex } = await History.getHistory(denops);

  // Calculate new index
  const newHistoryIndex = direction === "older"
    ? historyIndex - 1
    : historyIndex + 1;

  // Check bounds
  if (newHistoryIndex < 0) {
    await denops.cmd(
      'echohl WarningMsg | echo "Already at oldest commit" | echohl None',
    );
    return;
  }
  if (newHistoryIndex >= history.length) {
    await denops.cmd(
      'echohl WarningMsg | echo "Already at newest commit" | echohl None',
    );
    return;
  }

  const historyEntry = history[newHistoryIndex];
  const newCommitish = historyEntry.commitish;
  const newFilename = historyEntry.filename;

  // Update buffers and rename them with commitish
  await updateBlameBuffers(
    denops,
    bufnrNav,
    bufnrBlame,
    newFilename,
    expr,
    newCommitish,
    "emojify" in (params ?? {}),
  );

  // After updateBlameBuffers, buffer numbers are still the same (we rename, not recreate)
  // But we need to get the updated buffer names to find the windows
  const newBufnameNav = formatBufname({
    scheme: "ginblamenav",
    expr: expr,
    params: {
      commitish: newCommitish,
      ...(("emojify" in (params ?? {})) ? { emojify: "" } : {}),
    },
    fragment: newFilename,
  });

  // Get the actual buffer number after rename
  const actualBufnrNav = await fn.bufnr(denops, newBufnameNav);

  // Update the file fragment in nav buffer variable if filename changed
  if (newFilename !== fileFragment) {
    await fn.setbufvar(
      denops,
      actualBufnrNav,
      "gin_blame_file_fragment",
      newFilename,
    );
  }

  // Save new history index (use actual buffer numbers)
  const newBufnameBlame = formatBufname({
    scheme: "ginblame",
    expr: expr,
    params: {
      commitish: newCommitish,
      ...(("emojify" in (params ?? {})) ? { emojify: "" } : {}),
    },
    fragment: newFilename,
  });
  const actualBufnrBlame = await fn.bufnr(denops, newBufnameBlame);

  await History.saveHistory(
    denops,
    actualBufnrNav,
    actualBufnrBlame,
    history,
    newHistoryIndex,
  );

  // Restore cursor position from history (simple physical line number)
  // Move to nav buffer to restore cursor (cursorbind will sync to blame buffer)
  const winidNav = await fn.bufwinid(denops, actualBufnrNav);

  if (winidNav !== -1) {
    await fn.win_gotoid(denops, winidNav);
  }

  if (historyEntry.physicalLine > 0) {
    await fn.cursor(denops, historyEntry.physicalLine, 0);

    // Also set cursor in ginblame buffer explicitly (cursorbind is not reliable)
    const winidBlame = await fn.bufwinid(denops, bufnrBlame);
    if (winidBlame !== -1) {
      await fn.win_execute(
        denops,
        winidBlame,
        `call cursor(${historyEntry.physicalLine}, 0)`,
      );
    }
  }

  // Return to original window if called from ginblame
  if (scheme === "ginblame") {
    await fn.win_gotoid(denops, winidCurrent);
  }
}
