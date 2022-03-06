import { GitBranchResult } from "./parser.ts";

export function render(result: GitBranchResult): string[] {
  const buffer: string[] = [];
  for (const branch of result.branches) {
    switch (branch.kind) {
      case "alias":
      case "remote":
      case "local":
        buffer.push(branch.record);
    }
  }
  return buffer;
}
