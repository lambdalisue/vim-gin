const defaultPattern = /^(stash@\{(\d+)\})/;

export interface GitStashResult {
  entries: Entry[];
}

export type Entry = {
  stashRef: string;
  index: number;
};

export function parse(content: string[], pattern?: RegExp): GitStashResult {
  const entries: Entry[] = content.filter((v) => v).flatMap((record) => {
    const m = record.match(pattern ?? defaultPattern);
    if (m) {
      return [{
        stashRef: m[1],
        index: parseInt(m[2], 10),
      }];
    }
    return [];
  });
  return { entries };
}
