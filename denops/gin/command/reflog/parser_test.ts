import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { parse } from "./parser.ts";

Deno.test("parse default reflog output", () => {
  const content = [
    "bc7ea73 (HEAD -> main, origin/main) HEAD@{0}: commit: Allow --staged on GinDiff command",
    "5fb7d04 HEAD@{1}: commit: Add example configuration of component",
    "f24f947 HEAD@{2}: checkout: moving from feature to main",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "bc7ea73" },
      { commit: "5fb7d04" },
      { commit: "f24f947" },
    ],
  });
});

Deno.test("parse empty input", () => {
  const content: string[] = [];
  assertEquals(parse(content), {
    entries: [],
  });
});

Deno.test("parse input with empty lines", () => {
  const content = [
    "bc7ea73 HEAD@{0}: commit: First commit",
    "",
    "5fb7d04 HEAD@{1}: commit: Second commit",
    "",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "bc7ea73" },
      { commit: "5fb7d04" },
    ],
  });
});

Deno.test("parse reflog with full commit hashes", () => {
  const content = [
    "bc7ea737add7cbe9fb29d080d3560fe48b723967 HEAD@{0}: commit: First",
    "5fb7d047cf83710dd3c870e75af577aaeff9a3e5 HEAD@{1}: pull: Fast-forward",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "bc7ea737add7cbe9fb29d080d3560fe48b723967" },
      { commit: "5fb7d047cf83710dd3c870e75af577aaeff9a3e5" },
    ],
  });
});

Deno.test("parse reflog with various action types", () => {
  const content = [
    "abc1234 HEAD@{0}: commit: Add new feature",
    "def5678 HEAD@{1}: commit (amend): Fix typo",
    "9876543 HEAD@{2}: pull: Fast-forward",
    "1111111 HEAD@{3}: checkout: moving from main to feature",
    "2222222 HEAD@{4}: rebase (finish): returning to refs/heads/main",
    "3333333 HEAD@{5}: reset: moving to HEAD~1",
    "4444444 HEAD@{6}: merge feature: Merge made by the 'ort' strategy.",
    "5555555 HEAD@{7}: commit (initial): Initial commit",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "abc1234" },
      { commit: "def5678" },
      { commit: "9876543" },
      { commit: "1111111" },
      { commit: "2222222" },
      { commit: "3333333" },
      { commit: "4444444" },
      { commit: "5555555" },
    ],
  });
});

Deno.test("parse reflog for non-HEAD ref", () => {
  const content = [
    "abc1234 main@{0}: commit: Update README",
    "def5678 main@{1}: commit: Initial commit",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "abc1234" },
      { commit: "def5678" },
    ],
  });
});

Deno.test("parse lines that do not match the pattern", () => {
  const content = [
    "not a reflog line",
    "abc1234 HEAD@{0}: commit: Valid entry",
    "  indented line that should not match",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "abc1234" },
    ],
  });
});

Deno.test("parse with custom pattern", () => {
  const content = [
    "abc1234 HEAD@{0}: commit: First",
    "def5678 HEAD@{1}: commit: Second",
  ];
  const customPattern = /^([a-fA-F0-9]{7})/;
  assertEquals(parse(content, customPattern), {
    entries: [
      { commit: "abc1234" },
      { commit: "def5678" },
    ],
  });
});

Deno.test("parse reflog with decorations", () => {
  const content = [
    "bc7ea73 (HEAD -> main, tag: v1.0.0) HEAD@{0}: commit: Release v1.0.0",
    "5fb7d04 (origin/main) HEAD@{1}: pull: Fast-forward",
    "f24f947 HEAD@{2}: commit: Add feature",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "bc7ea73" },
      { commit: "5fb7d04" },
      { commit: "f24f947" },
    ],
  });
});
