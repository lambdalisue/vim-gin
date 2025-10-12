import { parseGitBlamePorcelain } from "./parser.ts";

// Generate test data for benchmarking
function generateBlameData(numLines: number, numCommits: number): string[] {
  const lines: string[] = [];
  const commits: string[] = [];

  // Generate unique commit SHAs
  for (let i = 0; i < numCommits; i++) {
    commits.push(i.toString().padStart(40, "0"));
  }

  // Generate blame output
  for (let lineNum = 1; lineNum <= numLines; lineNum++) {
    const commitIndex = Math.floor(Math.random() * numCommits);
    const sha = commits[commitIndex];
    const isFirstLineOfGroup = Math.random() > 0.7;

    // Header line
    if (isFirstLineOfGroup) {
      const groupSize = Math.min(5, numLines - lineNum + 1);
      lines.push(`${sha} ${lineNum} ${lineNum} ${groupSize}`);
    } else {
      lines.push(`${sha} ${lineNum} ${lineNum}`);
    }

    // Add metadata only for new commits (simulate real git blame behavior)
    if (!lines.some((l) => l.includes(sha) && l !== lines[lines.length - 1])) {
      lines.push(`author Author ${commitIndex}`);
      lines.push(`author-mail <author${commitIndex}@example.com>`);
      lines.push(`author-time ${1000000000 + commitIndex * 1000}`);
      lines.push(`author-tz +0900`);
      lines.push(`committer Committer ${commitIndex}`);
      lines.push(`committer-mail <committer${commitIndex}@example.com>`);
      lines.push(`committer-time ${1000000000 + commitIndex * 1000 + 100}`);
      lines.push(`committer-tz +0900`);
      lines.push(`summary Commit message ${commitIndex}`);
      lines.push(`filename file.txt`);
    }

    // Content line
    lines.push(`\tLine ${lineNum} content with some text to make it realistic`);
  }

  return lines;
}

// Pre-generate test data
const smallFileData = generateBlameData(100, 10);
const mediumFileData = generateBlameData(1000, 50);
const largeFileData = generateBlameData(10000, 200);
const veryLargeFileData = generateBlameData(50000, 500);

// Worst case: each line from different commit
const worstCaseData: string[] = [];
for (let i = 1; i <= 1000; i++) {
  const sha = i.toString().padStart(40, "0");
  worstCaseData.push(`${sha} ${i} ${i} 1`);
  worstCaseData.push(`author Author ${i}`);
  worstCaseData.push(`author-mail <author${i}@example.com>`);
  worstCaseData.push(`author-time ${1000000000 + i}`);
  worstCaseData.push(`author-tz +0900`);
  worstCaseData.push(`committer Committer ${i}`);
  worstCaseData.push(`committer-mail <committer${i}@example.com>`);
  worstCaseData.push(`committer-time ${1000000000 + i}`);
  worstCaseData.push(`committer-tz +0900`);
  worstCaseData.push(`summary Commit ${i}`);
  worstCaseData.push(`filename file.txt`);
  worstCaseData.push(`\tLine ${i} content`);
}

// Benchmarks
Deno.bench("parseGitBlamePorcelain - small file (100 lines)", () => {
  parseGitBlamePorcelain(smallFileData);
});

Deno.bench("parseGitBlamePorcelain - medium file (1K lines)", () => {
  parseGitBlamePorcelain(mediumFileData);
});

Deno.bench("parseGitBlamePorcelain - large file (10K lines)", () => {
  parseGitBlamePorcelain(largeFileData);
});

Deno.bench("parseGitBlamePorcelain - very large file (50K lines)", () => {
  parseGitBlamePorcelain(veryLargeFileData);
});

Deno.bench("parseGitBlamePorcelain - worst case (1K unique commits)", () => {
  parseGitBlamePorcelain(worstCaseData);
});

// Edge case benchmarks
Deno.bench("parseGitBlamePorcelain - empty input", () => {
  parseGitBlamePorcelain([]);
});

Deno.bench("parseGitBlamePorcelain - single line", () => {
  parseGitBlamePorcelain([
    "0123456789abcdef0123456789abcdef01234567 1 1 1",
    "author John Doe",
    "author-mail <john@example.com>",
    "author-time 1234567890",
    "author-tz +0900",
    "committer John Doe",
    "committer-mail <john@example.com>",
    "committer-time 1234567890",
    "committer-tz +0900",
    "summary Test commit",
    "filename test.txt",
    "\tHello world",
  ]);
});
