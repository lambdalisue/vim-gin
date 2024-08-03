import { assert, is } from "jsr:@core/unknownutil@^4.0.0";

export function formatTreeish(
  commitish: string | string[] | undefined,
  relpath: string,
): [] | [string] {
  if (commitish) {
    assert(commitish, is.String, { name: "commitish" });
    return [`${commitish}:${relpath}`];
  } else {
    return [`:${relpath}`];
  }
}
