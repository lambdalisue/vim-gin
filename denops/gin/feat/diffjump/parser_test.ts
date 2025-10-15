import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type Jump, parse } from "./parser.ts";

const example = (await Deno.readTextFile(
  new URL("./parser_test.diff", import.meta.url),
)).split("\n");

Deno.test("parse() - old side (deleted lines)", () => {
  const testcases: [number, Jump | undefined][] = [
    [0, undefined], // --- header
    [1, undefined], // +++ header
    [2, undefined], // @@ header
    [3, { type: "old", old: { path: "a/path/to/lao", lnum: 1 } }], // -The Way...
    [4, { type: "old", old: { path: "a/path/to/lao", lnum: 2 } }], // -The name...
    [6, { type: "old", old: { path: "a/path/to/lao", lnum: 4 } }], // -The Named...
  ];
  for (const [idx, exp] of testcases) {
    assertEquals(parse(idx, example), exp, `Failed at line ${idx}`);
  }
});

Deno.test("parse() - new side (added lines)", () => {
  const testcases: [number, Jump | undefined][] = [
    [0, undefined], // --- header
    [1, undefined], // +++ header
    [2, undefined], // @@ header
    [7, { type: "new", new: { path: "b/path/to/tzu", lnum: 2 } }], // +The named...
    [8, { type: "new", new: { path: "b/path/to/tzu", lnum: 3 } }], // +
    [16, { type: "new", new: { path: "b/path/to/tzu", lnum: 11 } }], // +They both...
    [17, { type: "new", new: { path: "b/path/to/tzu", lnum: 12 } }], // +Deeper...
    [18, { type: "new", new: { path: "b/path/to/tzu", lnum: 13 } }], // +The door...
  ];
  for (const [idx, exp] of testcases) {
    assertEquals(parse(idx, example), exp, `Failed at line ${idx}`);
  }
});

Deno.test("parse() - both sides (context lines)", () => {
  const testcases: [number, Jump | undefined][] = [
    [5, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 3 },
      new: { path: "b/path/to/tzu", lnum: 1 },
    }], //  The Nameless...
    [9, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 5 },
      new: { path: "b/path/to/tzu", lnum: 4 },
    }], //  Therefore...
    [10, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 6 },
      new: { path: "b/path/to/tzu", lnum: 5 },
    }], //    so we may...
    [11, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 7 },
      new: { path: "b/path/to/tzu", lnum: 6 },
    }], //  And let...
    [13, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 9 },
      new: { path: "b/path/to/tzu", lnum: 8 },
    }], //  The two...
    [14, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 10 },
      new: { path: "b/path/to/tzu", lnum: 9 },
    }], //  But after...
    [15, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 11 },
      new: { path: "b/path/to/tzu", lnum: 10 },
    }], //    they have...
  ];
  for (const [idx, exp] of testcases) {
    assertEquals(parse(idx, example), exp, `Failed at line ${idx}`);
  }
});

Deno.test("parse() - comprehensive test of all lines", () => {
  const testcases: [number, Jump | undefined][] = [
    [0, undefined], // --- a/path/to/lao
    [1, undefined], // +++ b/path/to/tzu
    [2, undefined], // @@ -1,7 +1,6 @@
    [3, { type: "old", old: { path: "a/path/to/lao", lnum: 1 } }], // -The Way...
    [4, { type: "old", old: { path: "a/path/to/lao", lnum: 2 } }], // -The name...
    [5, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 3 },
      new: { path: "b/path/to/tzu", lnum: 1 },
    }], //  The Nameless...
    [6, { type: "old", old: { path: "a/path/to/lao", lnum: 4 } }], // -The Named...
    [7, { type: "new", new: { path: "b/path/to/tzu", lnum: 2 } }], // +The named...
    [8, { type: "new", new: { path: "b/path/to/tzu", lnum: 3 } }], // +
    [9, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 5 },
      new: { path: "b/path/to/tzu", lnum: 4 },
    }], //  Therefore...
    [10, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 6 },
      new: { path: "b/path/to/tzu", lnum: 5 },
    }], //    so we may...
    [11, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 7 },
      new: { path: "b/path/to/tzu", lnum: 6 },
    }], //  And let...
    [12, undefined], // @@ -9,3 +8,6 @@
    [13, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 9 },
      new: { path: "b/path/to/tzu", lnum: 8 },
    }], //  The two...
    [14, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 10 },
      new: { path: "b/path/to/tzu", lnum: 9 },
    }], //  But after...
    [15, {
      type: "both",
      old: { path: "a/path/to/lao", lnum: 11 },
      new: { path: "b/path/to/tzu", lnum: 10 },
    }], //    they have...
    [16, { type: "new", new: { path: "b/path/to/tzu", lnum: 11 } }], // +They both...
    [17, { type: "new", new: { path: "b/path/to/tzu", lnum: 12 } }], // +Deeper...
    [18, { type: "new", new: { path: "b/path/to/tzu", lnum: 13 } }], // +The door...
  ];
  for (const [idx, exp] of testcases) {
    assertEquals(
      parse(idx, example),
      exp,
      `Failed at line ${idx}: "${example[idx]}"`,
    );
  }
});
