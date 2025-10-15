import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Commitish, INDEX, WORKTREE } from "../../feat/diffjump/jump.ts";
import { parseCommitish } from "./commitish.ts";

Deno.test("parseCommitish", () => {
  const testcases: [[string, boolean], [Commitish, Commitish]][] = [
    [["", false], [INDEX, WORKTREE]],
    [["A", false], ["A", WORKTREE]],
    [["", true], ["", INDEX]],
    [["A", true], ["A", INDEX]],
    [["A..B", false], ["A", "B"]],
    [["A...B", false], ["A...B", "B"]],
  ];
  for (const [[commitish, cached], [lhs, rhs]] of testcases) {
    assertEquals([lhs, rhs], parseCommitish(commitish, cached));
  }
});
