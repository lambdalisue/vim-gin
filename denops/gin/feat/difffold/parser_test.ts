import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { type FileSection, parse } from "./parser.ts";

Deno.test("parse() - single file", () => {
  const content = [
    "--- a/file1.txt",
    "+++ b/file1.txt",
    "@@ -1,3 +1,4 @@",
    " line1",
    "-line2",
    "+line2 modified",
  ];

  const result = parse(content);
  const expected: FileSection[] = [
    {
      start: 1,
      end: 6,
      oldPath: "a/file1.txt",
      newPath: "b/file1.txt",
    },
  ];

  assertEquals(result, expected);
});

Deno.test("parse() - multiple files", () => {
  const content = [
    "--- a/file1.txt",
    "+++ b/file1.txt",
    "@@ -1,3 +1,4 @@",
    " line1",
    "--- a/file2.txt",
    "+++ b/file2.txt",
    "@@ -1,2 +1,2 @@",
    " line2",
    "--- a/file3.txt",
    "+++ b/file3.txt",
    "@@ -5,6 +5,7 @@",
    " line3",
  ];

  const result = parse(content);
  const expected: FileSection[] = [
    {
      start: 1,
      end: 4,
      oldPath: "a/file1.txt",
      newPath: "b/file1.txt",
    },
    {
      start: 5,
      end: 8,
      oldPath: "a/file2.txt",
      newPath: "b/file2.txt",
    },
    {
      start: 9,
      end: 12,
      oldPath: "a/file3.txt",
      newPath: "b/file3.txt",
    },
  ];

  assertEquals(result, expected);
});

Deno.test("parse() - empty content", () => {
  const content: string[] = [];
  const result = parse(content);
  assertEquals(result, []);
});

Deno.test("parse() - no file headers", () => {
  const content = [
    "@@ -1,3 +1,4 @@",
    " line1",
    "-line2",
    "+line2 modified",
  ];

  const result = parse(content);
  assertEquals(result, []);
});
