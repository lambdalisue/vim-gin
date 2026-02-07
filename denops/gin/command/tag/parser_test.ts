import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { parse } from "./parser.ts";

Deno.test("parse default format output", () => {
  const content = [
    "a220f64 v0.0.0 2022-03-04 Initial release",
    "fc95d6d v0.1.0 2022-03-31 Add new feature",
    "6bfc537 v1.0.0 2022-08-02 Major release",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v0.0.0" },
      { commit: "fc95d6d", tag: "v0.1.0" },
      { commit: "6bfc537", tag: "v1.0.0" },
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
    "a220f64 v0.0.0 2022-03-04 Initial release",
    "",
    "fc95d6d v0.1.0 2022-03-31 Add new feature",
    "",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v0.0.0" },
      { commit: "fc95d6d", tag: "v0.1.0" },
    ],
  });
});

Deno.test("parse tags without subject", () => {
  const content = [
    "a220f64 v0.0.0 2022-03-04",
    "fc95d6d v0.1.0 2022-03-31",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v0.0.0" },
      { commit: "fc95d6d", tag: "v0.1.0" },
    ],
  });
});

Deno.test("parse tags with full commit hashes", () => {
  const content = [
    "a220f64abc123def456789012345678901234567 v0.0.0 2022-03-04 Initial release",
    "fc95d6dabc123def456789012345678901234567 v0.1.0 2022-03-31 Add new feature",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64abc123def456789012345678901234567", tag: "v0.0.0" },
      { commit: "fc95d6dabc123def456789012345678901234567", tag: "v0.1.0" },
    ],
  });
});

Deno.test("parse tags with special characters in name", () => {
  const content = [
    "a220f64 v1.0.0-rc.1 2024-01-15 Release candidate",
    "fc95d6d release/v3.0 2024-02-20 Release branch tag",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v1.0.0-rc.1" },
      { commit: "fc95d6d", tag: "release/v3.0" },
    ],
  });
});

Deno.test("parse lines that do not match the pattern", () => {
  const content = [
    "  indented line that should not match",
    "a220f64 v1.0.0 2024-01-15 Valid entry",
    "not-a-hash v2.0.0 2024-02-20 Invalid hash",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v1.0.0" },
    ],
  });
});

Deno.test("parse with custom pattern", () => {
  const content = [
    "a220f64 v0.0.0 2022-03-04 Initial release",
    "fc95d6d v0.1.0 2022-03-31 Add new feature",
  ];
  const customPattern = /^([a-fA-F0-9]{7})\s+(v\d+\.\d+\.\d+)/;
  assertEquals(parse(content, customPattern), {
    entries: [
      { commit: "a220f64", tag: "v0.0.0" },
      { commit: "fc95d6d", tag: "v0.1.0" },
    ],
  });
});

Deno.test("parse tags with emoji in subject", () => {
  const content = [
    "a220f64 v0.0.0 2022-03-04 :memo: Update documentations",
    "fc95d6d v0.1.0 2022-03-31 :sparkles: Add new feature",
  ];
  assertEquals(parse(content), {
    entries: [
      { commit: "a220f64", tag: "v0.0.0" },
      { commit: "fc95d6d", tag: "v0.1.0" },
    ],
  });
});
