const defaultPattern = /^([a-fA-F0-9]+)\s+(\S+)/;

export interface GitTagResult {
  entries: Entry[];
}

export type Entry = {
  commit: string;
  tag: string;
};

export function parse(content: string[], pattern?: RegExp): GitTagResult {
  const entries: Entry[] = content.filter((v) => v).flatMap((record) => {
    const m = record.match(pattern ?? defaultPattern);
    if (m) {
      return [{
        commit: m[1],
        tag: m[2],
      }];
    }
    return [];
  });
  return { entries };
}
