const patternSpc = /^(?:@@|\-\-\-|\+\+\+) /;
const patternRng = /^@@ \-(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/;
const patternOld = /^\-\-\- (.*?)(?:\t.*)?$/;
const patternNew = /^\+\+\+ (.*?)(?:\t.*)?$/;

export type Jump = {
  path: string;
  lnum: number;
};

export function findJumpOld(
  index: number,
  content: string[],
): Jump | undefined {
  if (patternSpc.test(content[index])) {
    // We cannot find jump for special lines
    return undefined;
  }
  let path = "";
  let lnum = -1;
  let offset = 0;
  for (let i = index; i >= 0; i--) {
    const line = content[i];
    if (lnum === -1) {
      const m1 = line.match(patternRng);
      if (m1) {
        lnum = Number(m1[1]);
        continue;
      }
      if (!line.startsWith("+")) {
        offset += 1;
      }
    }
    const m2 = line.match(patternOld);
    if (m2) {
      path = m2[1];
      break;
    }
  }
  if (lnum === -1) {
    throw new Error(`No range pattern found in ${content}`);
  }
  if (path === "") {
    throw new Error(`No old pattern found in ${content}`);
  }
  lnum += offset - 1;
  return {
    path,
    lnum,
  };
}

export function findJumpNew(
  index: number,
  content: string[],
): Jump | undefined {
  if (patternSpc.test(content[index])) {
    // We cannot find jump for special lines
    return undefined;
  }
  let path = "";
  let lnum = -1;
  let offset = 0;
  for (let i = index; i >= 0; i--) {
    const line = content[i];
    if (lnum === -1) {
      const m1 = line.match(patternRng);
      if (m1) {
        lnum = Number(m1[2]);
        continue;
      }
      if (!line.startsWith("-")) {
        offset += 1;
      }
    }
    const m2 = line.match(patternNew);
    if (m2) {
      path = m2[1];
      break;
    }
  }
  if (lnum === -1) {
    throw new Error(`No range pattern found in ${content}`);
  }
  if (path === "") {
    throw new Error(`No new pattern found in ${content}`);
  }
  lnum += Math.max(offset - 1, 0);
  return {
    path,
    lnum,
  };
}
