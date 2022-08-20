const entryWithOrigPathPattern =
  /^([^#]{2}) (?:"(.*?)"|(.*)) -> (?:"(.*?)"|(.*))$/;
const entryWithoutOrigPathPattern = /^([^#]{2}) (?:"(.*?)"|(.*))$/;

export interface GitStatusResult {
  entries: Entry[];
}

export type Entry = {
  XY: string;
  path: string;
  origPath?: string;
};

export function parse(content: string[]): GitStatusResult {
  const entries: Entry[] = content.filter((v) => v).flatMap((record) => {
    const m1 = record.match(entryWithOrigPathPattern);
    if (m1) {
      return [{
        XY: m1[1].replace(" ", "."),
        path: m1[4] ?? m1[5],
        origPath: m1[2] ?? m1[3],
      }];
    }
    const m2 = record.match(entryWithoutOrigPathPattern);
    if (m2) {
      return [{
        XY: m2[1].replace(" ", "."),
        path: m2[2] ?? m2[3],
      }];
    }
    return [];
  });
  return { entries };
}
