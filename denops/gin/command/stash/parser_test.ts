import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { parse } from "./parser.ts";

Deno.test("parse standard stash list output", () => {
  const content = [
    "stash@{0}: WIP on main: abc1234 Some commit message",
    "stash@{1}: On feature: def5678 Another commit",
    "stash@{2}: WIP on develop: 9876543 Third stash entry",
  ];
  assertEquals(parse(content), {
    entries: [
      { stashRef: "stash@{0}", index: 0 },
      { stashRef: "stash@{1}", index: 1 },
      { stashRef: "stash@{2}", index: 2 },
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
    "stash@{0}: WIP on main: abc1234 First",
    "",
    "stash@{1}: On feature: def5678 Second",
    "",
  ];
  assertEquals(parse(content), {
    entries: [
      { stashRef: "stash@{0}", index: 0 },
      { stashRef: "stash@{1}", index: 1 },
    ],
  });
});

Deno.test("parse with custom format output", () => {
  const content = [
    "stash@{0}: On main: WIP with special chars !@#$%",
    "stash@{1}: WIP on main: 1234567 message with (parens) and [brackets]",
  ];
  assertEquals(parse(content), {
    entries: [
      { stashRef: "stash@{0}", index: 0 },
      { stashRef: "stash@{1}", index: 1 },
    ],
  });
});

Deno.test("parse with custom pattern", () => {
  // Custom pattern that captures stash ref differently
  const content = [
    "stash@{0}: WIP on main: abc1234 First",
    "stash@{1}: On feature: def5678 Second",
  ];
  const customPattern = /^(stash@\{(\d+)\})/;
  assertEquals(parse(content, customPattern), {
    entries: [
      { stashRef: "stash@{0}", index: 0 },
      { stashRef: "stash@{1}", index: 1 },
    ],
  });
});

Deno.test("parse lines that do not match the pattern", () => {
  const content = [
    "not a stash line",
    "stash@{0}: WIP on main: abc1234 First",
    "another non-matching line",
  ];
  assertEquals(parse(content), {
    entries: [
      { stashRef: "stash@{0}", index: 0 },
    ],
  });
});

Deno.test("parse ignores stash ref not at start of line", () => {
  const content = [
    "Some text stash@{0}: WIP on main: abc1234 Not a stash line",
    "  stash@{1}: WIP on main: abc1234 Indented line",
  ];
  assertEquals(parse(content), {
    entries: [],
  });
});

Deno.test("parse stash list with large index", () => {
  const content = [
    "stash@{99}: WIP on main: abc1234 Ninety-ninth stash",
    "stash@{100}: On main: def5678 Hundredth stash",
  ];
  assertEquals(parse(content), {
    entries: [
      { stashRef: "stash@{99}", index: 99 },
      { stashRef: "stash@{100}", index: 100 },
    ],
  });
});
