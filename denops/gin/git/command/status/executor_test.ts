import { assertEquals, sandbox, using } from "../../../deps_test.ts";
import { execute } from "../../process.ts";
import { execStatus } from "./executor.ts";
import { GitStatusResult } from "./parser.ts";

Deno.test("execStatus() executes 'git status' command and return result", async () => {
  await using(await sandbox(), async (sbox) => {
    await sbox.create("alpha");
    await sbox.create("beta");
    await sbox.create("gamma");
    await execute(["init"]);
    await execute(["add", "alpha"]);
    await execute(["add", "beta"]);
    const r = await execStatus();
    assertEquals(compatibleGitStatusResult(r), {
      branch: {
        head: "main",
        oid: "",
      },
      entries: [
        {
          XY: "A.",
          hH: "",
          hI: "",
          kind: "changed",
          mH: "",
          mI: "",
          mW: "",
          path: "alpha",
          sub: "N...",
        },
        {
          XY: "A.",
          hH: "",
          hI: "",
          kind: "changed",
          mH: "",
          mI: "",
          mW: "",
          path: "beta",
          sub: "N...",
        },
        {
          XY: "??",
          kind: "untracked",
          path: "gamma",
        },
      ],
    });
  });
});
Deno.test("execStatus() executes 'git status' command and return result (cwd)", async () => {
  await using(await sandbox(), async (sbox) => {
    await sbox.create("alpha");
    await sbox.create("beta");
    await sbox.create("gamma");
    await execute(["init"]);
    await execute(["add", "alpha"]);
    await execute(["add", "beta"]);
    Deno.chdir("..");
    const r = await execStatus({
      cwd: sbox.root,
    });
    assertEquals(compatibleGitStatusResult(r), {
      branch: {
        head: "main",
        oid: "",
      },
      entries: [
        {
          XY: "A.",
          hH: "",
          hI: "",
          kind: "changed",
          mH: "",
          mI: "",
          mW: "",
          path: "alpha",
          sub: "N...",
        },
        {
          XY: "A.",
          hH: "",
          hI: "",
          kind: "changed",
          mH: "",
          mI: "",
          mW: "",
          path: "beta",
          sub: "N...",
        },
        {
          XY: "??",
          kind: "untracked",
          path: "gamma",
        },
      ],
    });
  });
});

function compatibleGitStatusResult(result: GitStatusResult): GitStatusResult {
  const entries = result.entries.map((e) => {
    switch (e.kind) {
      case "changed":
        return {
          ...e,
          mH: "",
          mI: "",
          mW: "",
          hH: "",
          hI: "",
        };
      case "renamed":
        return {
          ...e,
          mH: "",
          mI: "",
          mW: "",
          hH: "",
          hI: "",
          Xscore: "",
        };
      case "unmerged":
        return {
          ...e,
          m1: "",
          m2: "",
          m3: "",
          mW: "",
          h1: "",
          h2: "",
          h3: "",
        };
      case "untracked":
      case "ignored":
        return e;
    }
  });
  const branch = {
    ...result.branch,
    oid: "",
  };
  return {
    branch,
    entries,
  };
}
