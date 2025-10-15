import { type Commitish, INDEX, WORKTREE } from "../../feat/diffjump/jump.ts";

// git diff
//  INDEX -> WORKTREE
// git diff A
//  A -> WORKTREE
//
// git diff --cached
//  HEAD -> INDEX
// git diff --cached A
//  A -> INDEX
//
// git diff A..B
//  A -> B
// git diff A...B
//  A...B -> B
export function parseCommitish(
  commitish: string,
  cached = false,
): [Commitish, Commitish] {
  if (commitish.includes("...")) {
    return [commitish, commitish.split("...")[1]];
  } else if (commitish.includes("..")) {
    const [a, b] = commitish.split("..", 2);
    return [a, b];
  } else if (cached) {
    return [commitish, INDEX];
  } else {
    return [commitish || INDEX, WORKTREE];
  }
}
