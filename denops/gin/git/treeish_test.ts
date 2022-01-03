import { assertEquals } from "../deps_test.ts";
import { parseTreeish } from "./treeish.ts";

// https://git-scm.com/docs/revisions/2.1.4#Documentation/revisions.txt
const testcases: [string, [string, string]][] = [
  ["@", ["@", ""]],
  ["master@{yesterday}", ["master@{yesterday}", ""]],
  ["HEAD@\{5 minutes ago\}", ["HEAD@\{5 minutes ago\}", ""]],
  ["master@{1}", ["master@{1}", ""]],
  ["@{1}", ["@{1}", ""]],
  ["@\{-1\}", ["@\{-1\}", ""]],
  ["master@{upstream}", ["master@{upstream}", ""]],
  ["@{u}", ["@{u}", ""]],
  ["HEAD^", ["HEAD^", ""]],
  ["v1.5.1^0", ["v1.5.1^0", ""]],
  ["master~3", ["master~3", ""]],
  ["v0.99.8^{commit}", ["v0.99.8^{commit}", ""]],
  ["v0.99.8^\{\}", ["v0.99.8^\{\}", ""]],
  ["HEAD^{/fix nasty bug}", ["HEAD^{/fix nasty bug}", ""]],
  [":/fix nasty bug", [":/fix nasty bug", ""]],
  ["HEAD:README", ["HEAD", "README"]],
  [":README", ["", "README"]],
  ["master:./README", ["master", "./README"]],
  [":0:README", [":0", "README"]],
  [":README", ["", "README"]],
];
for (const [treeish, expect] of testcases) {
  Deno.test(`parseTreeish() returns ${JSON.stringify(expect)} for ${JSON.stringify(treeish)}`, () => {
    assertEquals(parseTreeish(treeish), expect);
  });
}
