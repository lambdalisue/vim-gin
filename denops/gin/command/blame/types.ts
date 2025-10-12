/**
 * History entry for blame navigation
 */
export type HistoryEntry = {
  /** Commit SHA or commitish */
  commitish: string;
  /** Physical line number in the nav buffer */
  physicalLine: number;
  /** Filename at this commit (may differ due to renames) */
  filename: string;
};

/**
 * Options for exec function
 */
export type ExecOptions = {
  worktree: string;
  commitish?: string;
  encoding?: string;
  fileformat?: string;
  emojify?: boolean;
};
