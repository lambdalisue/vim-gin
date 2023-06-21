import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.1/mod.ts#^";

export function formatTreeish(
  commitish: string | string[] | undefined,
  relpath: string,
): [] | [string] {
  if (commitish) {
    unknownutil.assertString(commitish);
    return [`${commitish}:${relpath}`];
  } else {
    return [`:${relpath}`];
  }
}
