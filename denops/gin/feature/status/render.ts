import { GitStatusResult } from "./parser.ts";

export function render(result: GitStatusResult): string[] {
  const buffer: string[] = [];
  buffer.push(formatBranch(result));
  for (const entry of result.entries) {
    switch (entry.kind) {
      case "changed":
      case "unmerged": {
        buffer.push(`${entry.XY.replace(".", " ")} ${entry.path}`);
        break;
      }
      case "renamed": {
        buffer.push(
          `${entry.XY.replace(".", " ")} ${entry.origPath} -> ${entry.path}`,
        );
        break;
      }
      case "untracked": {
        buffer.push(`?? ${entry.path}`);
        break;
      }
      case "ignored": {
        buffer.push(`!! ${entry.path}`);
        break;
      }
    }
  }
  return buffer;
}

function formatBranch(result: GitStatusResult): string {
  const b = result.branch;
  if (b.upstream) {
    return `## ${b.head}...${b.upstream} +${b.ahead} -${b.behind}`;
  } else {
    return `## ${b.head}`;
  }
}
