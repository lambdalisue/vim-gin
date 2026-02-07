const defaultPattern = /^([a-fA-F0-9]+)\b/;

export interface GitReflogResult {
  entries: Entry[];
}

export type Entry = {
  commit: string;
};

export function parse(content: string[], pattern?: RegExp): GitReflogResult {
  const entries: Entry[] = content.filter((v) => v).flatMap((record) => {
    const m = record.match(pattern ?? defaultPattern);
    if (m) {
      return [{
        commit: m[1],
      }];
    }
    return [];
  });
  return { entries };
}
