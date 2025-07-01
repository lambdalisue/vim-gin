import type { Tree, TreeNode, TreeBranch, TreeLeaf } from "jsr:@lambdalisue/ui-treeutil@^0.1.2";

interface LsTreeEntry {
  mode: string;
  type: "blob" | "tree";
  hash: string;
  path: string;
}

export function parseLsTreeOutput(output: string): LsTreeEntry[] {
  const lines = output.trim().split("\n").filter(line => line.length > 0);
  const entries: LsTreeEntry[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d+)\s+(blob|tree)\s+([0-9a-f]+)\s+(.+)$/);
    if (!match) {
      continue;
    }

    const [, mode, type, hash, path] = match;
    entries.push({
      mode,
      type: type as "blob" | "tree",
      hash,
      path,
    });
  }

  return entries;
}

export function buildTreeFromEntries(entries: LsTreeEntry[], rootLabel: string = "Root"): Tree {
  const root: TreeBranch = {
    label: rootLabel,
    value: "",
    children: [],
    collapsed: false,
  };

  const nodeMap = new Map<string, TreeBranch>();
  nodeMap.set("", root);

  // First pass: create all tree nodes
  for (const entry of entries) {
    if (entry.type === "tree") {
      const pathParts = entry.path.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");

      // Ensure parent exists
      let parent = nodeMap.get(parentPath);
      if (!parent) {
        const missingParts = parentPath.split("/").filter(p => p);
        let currentPath = "";
        let currentParent = root;

        for (const part of missingParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!nodeMap.has(currentPath)) {
            const newBranch: TreeBranch = {
              label: part,
              value: currentPath,
              children: [],
              collapsed: true,
            };
            currentParent.children = [...currentParent.children, newBranch];
            nodeMap.set(currentPath, newBranch);
            currentParent = newBranch;
          } else {
            currentParent = nodeMap.get(currentPath)!;
          }
        }
        parent = currentParent;
      }

      // Create the tree node if it doesn't exist
      if (!nodeMap.has(entry.path)) {
        const branch: TreeBranch = {
          label: fileName,
          value: entry.path,
          children: [],
          collapsed: true,
        };
        parent.children = [...parent.children, branch];
        nodeMap.set(entry.path, branch);
      }
    }
  }

  // Second pass: add all blob nodes
  for (const entry of entries) {
    if (entry.type === "blob") {
      const pathParts = entry.path.split("/");
      const fileName = pathParts[pathParts.length - 1];
      const parentPath = pathParts.slice(0, -1).join("/");

      let parent = nodeMap.get(parentPath);
      if (!parent) {
        // Create missing parent directories
        const missingParts = parentPath.split("/").filter(p => p);
        let currentPath = "";
        let currentParent = root;

        for (const part of missingParts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          if (!nodeMap.has(currentPath)) {
            const newBranch: TreeBranch = {
              label: part,
              value: currentPath,
              children: [],
              collapsed: true,
            };
            currentParent.children = [...currentParent.children, newBranch];
            nodeMap.set(currentPath, newBranch);
            currentParent = newBranch;
          } else {
            currentParent = nodeMap.get(currentPath)!;
          }
        }
        parent = currentParent;
      }

      const leaf: TreeLeaf = {
        label: fileName,
        value: entry.path,
      };
      parent.children = [...parent.children, leaf];
    }
  }

  sortTree(root);

  return { root };
}

function sortTree(node: TreeNode): void {
  if ("children" in node && node.children.length > 0) {
    const branches: TreeNode[] = [];
    const leaves: TreeNode[] = [];

    for (const child of node.children) {
      if ("children" in child) {
        branches.push(child);
        sortTree(child);
      } else {
        leaves.push(child);
      }
    }

    branches.sort((a, b) => a.label.localeCompare(b.label));
    leaves.sort((a, b) => a.label.localeCompare(b.label));

    node.children = [...branches, ...leaves];
  }
}

export function parseLsTreeToTree(output: string, rootLabel: string = "Root"): Tree {
  const entries = parseLsTreeOutput(output);
  return buildTreeFromEntries(entries, rootLabel);
}