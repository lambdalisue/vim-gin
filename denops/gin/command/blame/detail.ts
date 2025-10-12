import type { Denops } from "jsr:@denops/std@^7.0.0";
import { emojify } from "jsr:@lambdalisue/github-emoji@^1.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { execute } from "../../git/executor.ts";
import type { GitBlameResult } from "./parser.ts";
import { getBlameLine } from "./buffer_utils.ts";

/**
 * Update commit detail buffer with commit information
 * Shows the blame target commit when on first divider line (line 1),
 * otherwise shows the commit for the line under cursor
 */
export async function updateDetail(denops: Denops): Promise<void> {
  const bufnrCurrent = await fn.bufnr(denops);
  const bufnameCurrent = await fn.bufname(denops, bufnrCurrent);
  const { scheme, expr, params } = parseBufname(bufnameCurrent);

  const blameResult = await vars.b.get(denops, "gin_blame_result") as
    | GitBlameResult
    | undefined;
  if (!blameResult) {
    return;
  }

  const bufnameDetail = await vars.b.get(denops, "gin_blame_detail_bufname") as
    | string
    | undefined;
  if (!bufnameDetail) {
    return;
  }

  const shouldEmojify = "emojify" in (params ?? {});
  const lnum = await fn.line(denops, ".");
  const currentLine = await fn.getline(denops, lnum);

  let commitSha: string;

  // Check if on first divider line (line 1, empty)
  if (
    lnum === 1 &&
    (!currentLine || typeof currentLine === "string" && !currentLine.trim())
  ) {
    // Show the blame target commit
    const currentCommitish = Array.isArray(params?.commitish)
      ? params.commitish[0]
      : (params?.commitish ?? "HEAD");
    commitSha = currentCommitish;
  } else {
    // Show the commit for the line under cursor
    // Use getBlameLine to handle both ginblamenav and ginblame buffers
    const lineInfo = await getBlameLine(denops, scheme, lnum, blameResult);
    if (!lineInfo) {
      return; // Empty line or invalid position
    }

    commitSha = lineInfo.blameLine.commitSha;
  }

  // Check if already displaying this commit
  const lastCommitSha = await vars.b.get(
    denops,
    "gin_blame_detail_last_commit",
  ) as string | undefined;
  if (lastCommitSha === commitSha) {
    return;
  }

  // Execute git show to get full commit details
  const { stdout } = await execute(denops, [
    "show",
    "--no-patch",
    "--format=fuller",
    commitSha,
  ], {
    worktree: expr,
    throwOnError: false,
    stdoutIndicator: "null",
  });

  const { content } = await buffer.decode(denops, bufnrCurrent, stdout, {});
  const formattedContent = reformatCommitDetail(content, shouldEmojify);

  const bufnrDetail = await fn.bufnr(denops, bufnameDetail);
  if (bufnrDetail === -1) {
    return;
  }

  await buffer.replace(denops, bufnrDetail, formattedContent);
  await vars.b.set(denops, "gin_blame_detail_last_commit", commitSha);
}

/**
 * Reformat git show output: Metadata -> Summary -> Body
 * Apply emojify only to summary line
 */
function reformatCommitDetail(
  gitShowOutput: string[],
  shouldEmojify: boolean,
): string[] {
  const result: string[] = [];
  let i = 0;

  // Extract metadata lines (before blank line)
  const metadata: string[] = [];
  while (i < gitShowOutput.length) {
    const line = gitShowOutput[i];
    if (line.trim() === "") {
      i++;
      break;
    }
    metadata.push(line);
    i++;
  }

  // Extract commit message (after blank line)
  const messageLines: string[] = [];
  while (i < gitShowOutput.length) {
    messageLines.push(gitShowOutput[i]);
    i++;
  }

  // Reorder: Metadata -> Summary -> Body
  result.push(...metadata);

  if (metadata.length > 0 && messageLines.length > 0) {
    result.push("");
  }

  if (messageLines.length > 0) {
    // Apply emojify only to first line (summary)
    const summaryLine = messageLines[0];
    const emojifiedSummary = shouldEmojify ? emojify(summaryLine) : summaryLine;
    result.push(emojifiedSummary);

    // Add rest of message without emojify
    for (let j = 1; j < messageLines.length; j++) {
      result.push(messageLines[j]);
    }
  }

  return result;
}
