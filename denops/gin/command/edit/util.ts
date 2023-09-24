import { assert, is } from "https://deno.land/x/unknownutil@v3.9.0/mod.ts#^";

export function formatTreeish(
  commitish: string | string[] | undefined,
  relpath: string,
): [] | [string] {
  if (commitish) {
    assert(commitish, is.String, { message: "commitish must be string" });
    return [`${commitish}:${relpath}`];
  } else {
    return [`:${relpath}`];
  }
}
