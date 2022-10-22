import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

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

export function isExistsOnDistButNotInTheIndex(errorMessage: string): boolean {
  const searchMessage = "exists on disk, but not in the index";
  return errorMessage.includes(searchMessage);
}
