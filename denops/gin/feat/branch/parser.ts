import { decodeUtf8 } from "../../util/text.ts";

const branchAliasPattern = /^\s{2}(remotes\/([^\/]+)\/(\S+))\s+-> (\S+)$/;
const remoteBranchPattern =
  /^\s{2}(remotes\/([^\/]+)\/(\S+))\s+([a-f0-9]+) (.*)$/;
const localBranchPattern =
  /^([* ]) (\S+)\s+([a-f0-9]+) \[(\S+)(?:: [^\]]+)?\] (.*)$/;

export class GitBranchParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitBranchParseError";
  }
}

type LocalBranch = {
  kind: "local";
  record: string;
  active: boolean;
  target: string;
  branch: string;
  commit: string;
  upstream: string;
  message: string;
};

type RemoteBranch = {
  kind: "remote";
  record: string;
  target: string;
  remote: string;
  branch: string;
  commit: string;
  message: string;
};

type BranchAlias = {
  kind: "alias";
  record: string;
  target: string;
  remote: string;
  branch: string;
  origin: string;
};

export type Branch = LocalBranch | RemoteBranch | BranchAlias;

export interface GitBranchResult {
  branches: Branch[];
}

export function parse(bytes: Uint8Array): GitBranchResult {
  const text = decodeUtf8(bytes);
  const records: string[] = text.replace(/\n$/, "").split("\n");
  const branches: Branch[] = records.map((record) => {
    const m1 = record.match(branchAliasPattern);
    if (m1) {
      return {
        kind: "alias",
        record,
        target: m1[1],
        remote: m1[2],
        branch: m1[3],
        origin: m1[4],
      };
    }
    const m2 = record.match(remoteBranchPattern);
    if (m2) {
      return {
        kind: "remote",
        record,
        target: m2[1],
        remote: m2[2],
        branch: m2[3],
        commit: m2[4],
        message: m2[5],
      };
    }
    const m3 = record.match(localBranchPattern);
    if (m3) {
      return {
        kind: "local",
        record,
        active: m3[1] === "*",
        target: m3[2],
        branch: m3[2],
        commit: m3[3],
        upstream: m3[4],
        message: m3[5],
      };
    }
    throw new Error(`Failed to parse 'git branch' record '${record}'`);
  });
  return { branches };
}
