import { assertEquals } from "jsr:@std/assert@^1.0.0";
import outdent from "jsr:@cspotcode/outdent@^0.8.0";
import {
  type GitBlameLine,
  type GitCommit,
  parseGitBlamePorcelain,
} from "./parser.ts";

Deno.test("parseGitBlamePorcelain", async (t) => {
  await t.step("parses basic porcelain output", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0900
      committer Jane Smith
      committer-mail <jane@example.com>
      committer-time 1234567891
      committer-tz -0800
      summary Initial commit
      filename test.txt
      	Hello world
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    const expectedCommit: GitCommit = {
      author: {
        name: "John Doe",
        email: "john@example.com",
        time: new Date(1234567890 * 1000),
        timezone: "+0900",
      },
      committer: {
        name: "Jane Smith",
        email: "jane@example.com",
        time: new Date(1234567891 * 1000),
        timezone: "-0800",
      },
      summary: "Initial commit",
      boundary: false,
      filename: "test.txt",
    };

    const expectedLine: GitBlameLine = {
      lineNumber: 1,
      originalLineNumber: 1,
      commitSha: "0123456789abcdef0123456789abcdef01234567",
      content: "Hello world",
      numLinesInGroup: 1,
    };

    assertEquals(
      result.commits["0123456789abcdef0123456789abcdef01234567"],
      expectedCommit,
    );
    assertEquals(result.lines.length, 1);
    assertEquals(result.lines[0], expectedLine);
  });

  await t.step("parses multiple lines from same commit", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 3
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0900
      committer John Doe
      committer-mail <john@example.com>
      committer-time 1234567890
      committer-tz +0900
      summary Add multi-line content
      filename test.txt
      	Line 1
      0123456789abcdef0123456789abcdef01234567 2 2
      	Line 2
      0123456789abcdef0123456789abcdef01234567 3 3
      	Line 3
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(Object.keys(result.commits).length, 1);
    assertEquals(result.lines.length, 3);

    assertEquals(result.lines[0].lineNumber, 1);
    assertEquals(result.lines[0].content, "Line 1");
    assertEquals(result.lines[0].numLinesInGroup, 3);

    assertEquals(result.lines[1].lineNumber, 2);
    assertEquals(result.lines[1].content, "Line 2");
    assertEquals(result.lines[1].numLinesInGroup, 3);

    assertEquals(result.lines[2].lineNumber, 3);
    assertEquals(result.lines[2].content, "Line 3");
    assertEquals(result.lines[2].numLinesInGroup, 3);
  });

  await t.step("parses boundary commits", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0000
      committer John Doe
      committer-mail <john@example.com>
      committer-time 1234567890
      committer-tz +0000
      summary Initial commit
      boundary
      filename test.txt
      	Initial content
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(
      result.commits["0123456789abcdef0123456789abcdef01234567"].boundary,
      true,
    );
  });

  await t.step("parses previous commit information", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0000
      committer John Doe
      committer-mail <john@example.com>
      committer-time 1234567890
      committer-tz +0000
      summary Move file
      previous fedcba9876543210fedcba9876543210fedcba98 old-file.txt
      filename new-file.txt
      	Moved content
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    const commit = result.commits["0123456789abcdef0123456789abcdef01234567"];
    assertEquals(commit.previous, {
      sha: "fedcba9876543210fedcba9876543210fedcba98",
      filename: "old-file.txt",
    });
  });

  await t.step("handles empty lines", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0000
      committer John Doe
      committer-mail <john@example.com>
      committer-time 1234567890
      committer-tz +0000
      summary Add empty line
      filename test.txt
      	
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(result.lines[0].content, "");
  });

  await t.step("handles special characters in content", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail <john@example.com>
      author-time 1234567890
      author-tz +0000
      committer John Doe
      committer-mail <john@example.com>
      committer-time 1234567890
      committer-tz +0000
      summary Add special chars
      filename test.txt
      	\tTab\tcharacters\tand "quotes" and 'apostrophes'
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(
      result.lines[0].content,
      `\tTab\tcharacters\tand "quotes" and 'apostrophes'`,
    );
  });

  await t.step("parses complex multi-commit output", () => {
    const input = outdent`
      abc1234567890123456789012345678901234567 1 1 2
      author Alice
      author-mail <alice@example.com>
      author-time 1000000000
      author-tz +0100
      committer Alice
      committer-mail <alice@example.com>
      committer-time 1000000000
      committer-tz +0100
      summary First commit
      filename file.txt
      	First line
      abc1234567890123456789012345678901234567 2 2
      	Second line
      def1234567890123456789012345678901234567 3 3 1
      author Bob
      author-mail <bob@example.com>
      author-time 1000000100
      author-tz -0500
      committer Charlie
      committer-mail <charlie@example.com>
      committer-time 1000000200
      committer-tz +0000
      summary Add third line
      filename file.txt
      	Third line
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(Object.keys(result.commits).length, 2);
    assertEquals(result.lines.length, 3);

    const commit1 = result.commits["abc1234567890123456789012345678901234567"];
    assertEquals(commit1.author.name, "Alice");
    assertEquals(commit1.summary, "First commit");

    const commit2 = result.commits["def1234567890123456789012345678901234567"];
    assertEquals(commit2.author.name, "Bob");
    assertEquals(commit2.committer.name, "Charlie");
    assertEquals(commit2.summary, "Add third line");

    assertEquals(
      result.lines[0].commitSha,
      "abc1234567890123456789012345678901234567",
    );
    assertEquals(
      result.lines[1].commitSha,
      "abc1234567890123456789012345678901234567",
    );
    assertEquals(
      result.lines[2].commitSha,
      "def1234567890123456789012345678901234567",
    );
  });

  await t.step("handles malformed email addresses", () => {
    const input = outdent`
      0123456789abcdef0123456789abcdef01234567 1 1 1
      author John Doe
      author-mail john@example.com
      author-time 1234567890
      author-tz +0000
      committer Jane Smith
      committer-mail <jane@example.com>
      committer-time 1234567890
      committer-tz +0000
      summary Handle different email formats
      filename test.txt
      	Content
    `;

    const result = parseGitBlamePorcelain(input.split("\n"));

    assertEquals(
      result.commits["0123456789abcdef0123456789abcdef01234567"].author.email,
      "john@example.com",
    );
    assertEquals(
      result.commits["0123456789abcdef0123456789abcdef01234567"].committer
        .email,
      "jane@example.com",
    );
  });

  await t.step("returns empty result for empty input", () => {
    const result = parseGitBlamePorcelain([]);
    assertEquals(result, { commits: {}, lines: [] });
  });

  await t.step("handles input with only whitespace", () => {
    const result = parseGitBlamePorcelain(["   ", "\t", "   "]);
    assertEquals(result, { commits: {}, lines: [] });
  });
});
