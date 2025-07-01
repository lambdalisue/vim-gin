import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { outdent } from "jsr:@cspotcode/outdent@^0.8.0";
import { parseLsTreeOutput, buildTreeFromEntries, parseLsTreeToTree } from "./parser.ts";

Deno.test("parseLsTreeOutput", async (t) => {
  await t.step("parses blob entries correctly", () => {
    const output = outdent`
      100644 blob 250f9dcf5b3fbf42d35ecac2f6060dd6e4af3316	.github/workflows/test.yml
      100644 blob b22fb8f98e5cbf0dd20136a732c5db76369a5499	.gitignore
    `;

    const entries = parseLsTreeOutput(output);
    
    assertEquals(entries.length, 2);
    assertEquals(entries[0], {
      mode: "100644",
      type: "blob",
      hash: "250f9dcf5b3fbf42d35ecac2f6060dd6e4af3316",
      path: ".github/workflows/test.yml",
    });
    assertEquals(entries[1], {
      mode: "100644",
      type: "blob",
      hash: "b22fb8f98e5cbf0dd20136a732c5db76369a5499",
      path: ".gitignore",
    });
  });

  await t.step("parses tree entries correctly", () => {
    const output = outdent`
      040000 tree 773ff9d932fb2638d6b1fd54ebbce566c4b7797b	.github
      040000 tree ca06869a17c3482a97ba2a9cd88224f5f488e482	autoload
    `;

    const entries = parseLsTreeOutput(output);
    
    assertEquals(entries.length, 2);
    assertEquals(entries[0], {
      mode: "040000",
      type: "tree",
      hash: "773ff9d932fb2638d6b1fd54ebbce566c4b7797b",
      path: ".github",
    });
    assertEquals(entries[1], {
      mode: "040000",
      type: "tree",
      hash: "ca06869a17c3482a97ba2a9cd88224f5f488e482",
      path: "autoload",
    });
  });

  await t.step("handles mixed entries", () => {
    const output = outdent`
      040000 tree 773ff9d932fb2638d6b1fd54ebbce566c4b7797b	.github
      100644 blob b22fb8f98e5cbf0dd20136a732c5db76369a5499	.gitignore
      100644 blob 5bee15b6574b8de61da2a6981978109145d5201e	LICENSE
      040000 tree ca06869a17c3482a97ba2a9cd88224f5f488e482	autoload
    `;

    const entries = parseLsTreeOutput(output);
    
    assertEquals(entries.length, 4);
    assertEquals(entries[0].type, "tree");
    assertEquals(entries[1].type, "blob");
    assertEquals(entries[2].type, "blob");
    assertEquals(entries[3].type, "tree");
  });

  await t.step("handles empty input", () => {
    const entries = parseLsTreeOutput("");
    assertEquals(entries, []);
  });

  await t.step("handles paths with spaces", () => {
    const output = outdent`
      100644 blob 250f9dcf5b3fbf42d35ecac2f6060dd6e4af3316	path with spaces/file.txt
    `;
    
    const entries = parseLsTreeOutput(output);
    assertEquals(entries.length, 1);
    assertEquals(entries[0].path, "path with spaces/file.txt");
  });
});

Deno.test("buildTreeFromEntries", async (t) => {
  await t.step("builds tree with flat structure", () => {
    const entries = [
      { mode: "100644", type: "blob" as const, hash: "abc123", path: "file1.txt" },
      { mode: "100644", type: "blob" as const, hash: "def456", path: "file2.txt" },
      { mode: "040000", type: "tree" as const, hash: "ghi789", path: "folder1" },
    ];

    const tree = buildTreeFromEntries(entries, "MyRoot");
    
    assertEquals(tree.root.label, "MyRoot");
    assertEquals(tree.root.value, "");
    assertEquals("children" in tree.root, true);
    
    if ("children" in tree.root) {
      assertEquals(tree.root.children.length, 3);
      
      // Check sorting: folders first, then files
      assertEquals(tree.root.children[0].label, "folder1");
      assertEquals(tree.root.children[1].label, "file1.txt");
      assertEquals(tree.root.children[2].label, "file2.txt");
      
      // Check folder is a branch
      assertEquals("children" in tree.root.children[0], true);
      if ("children" in tree.root.children[0]) {
        assertEquals(tree.root.children[0].collapsed, true);
      }
      
      // Check files are leaves
      assertEquals("children" in tree.root.children[1], false);
      assertEquals("children" in tree.root.children[2], false);
    }
  });

  await t.step("builds tree with nested structure", () => {
    const entries = [
      { mode: "100644", type: "blob" as const, hash: "abc123", path: "src/main.ts" },
      { mode: "100644", type: "blob" as const, hash: "def456", path: "src/utils.ts" },
      { mode: "040000", type: "tree" as const, hash: "ghi789", path: "src" },
      { mode: "100644", type: "blob" as const, hash: "jkl012", path: "README.md" },
    ];

    const tree = buildTreeFromEntries(entries);
    
    if ("children" in tree.root) {
      assertEquals(tree.root.children.length, 2);
      
      // src folder should be first
      assertEquals(tree.root.children[0].label, "src");
      assertEquals(tree.root.children[0].value, "src");
      
      // README.md should be second
      assertEquals(tree.root.children[1].label, "README.md");
      assertEquals(tree.root.children[1].value, "README.md");
      
      // Check src folder contains files
      if ("children" in tree.root.children[0]) {
        assertEquals(tree.root.children[0].children.length, 2);
        assertEquals(tree.root.children[0].children[0].label, "main.ts");
        assertEquals(tree.root.children[0].children[1].label, "utils.ts");
      }
    }
  });

  await t.step("handles deeply nested structures", () => {
    const entries = [
      { mode: "100644", type: "blob" as const, hash: "abc123", path: "a/b/c/file.txt" },
      { mode: "040000", type: "tree" as const, hash: "def456", path: "a" },
      { mode: "040000", type: "tree" as const, hash: "ghi789", path: "a/b" },
      { mode: "040000", type: "tree" as const, hash: "jkl012", path: "a/b/c" },
    ];

    const tree = buildTreeFromEntries(entries);
    
    if ("children" in tree.root) {
      assertEquals(tree.root.children.length, 1);
      assertEquals(tree.root.children[0].label, "a");
      
      if ("children" in tree.root.children[0]) {
        assertEquals(tree.root.children[0].children.length, 1);
        assertEquals(tree.root.children[0].children[0].label, "b");
        
        if ("children" in tree.root.children[0].children[0]) {
          assertEquals(tree.root.children[0].children[0].children.length, 1);
          assertEquals(tree.root.children[0].children[0].children[0].label, "c");
          
          if ("children" in tree.root.children[0].children[0].children[0]) {
            assertEquals(tree.root.children[0].children[0].children[0].children.length, 1);
            assertEquals(tree.root.children[0].children[0].children[0].children[0].label, "file.txt");
          }
        }
      }
    }
  });

  await t.step("creates missing intermediate directories", () => {
    const entries = [
      { mode: "100644", type: "blob" as const, hash: "abc123", path: "a/b/c/file.txt" },
    ];

    const tree = buildTreeFromEntries(entries);
    
    if ("children" in tree.root) {
      assertEquals(tree.root.children.length, 1);
      assertEquals(tree.root.children[0].label, "a");
      assertEquals(tree.root.children[0].value, "a");
      
      if ("children" in tree.root.children[0]) {
        assertEquals(tree.root.children[0].children.length, 1);
        assertEquals(tree.root.children[0].children[0].label, "b");
        assertEquals(tree.root.children[0].children[0].value, "a/b");
        
        if ("children" in tree.root.children[0].children[0]) {
          assertEquals(tree.root.children[0].children[0].children.length, 1);
          assertEquals(tree.root.children[0].children[0].children[0].label, "c");
          assertEquals(tree.root.children[0].children[0].children[0].value, "a/b/c");
        }
      }
    }
  });
});

Deno.test("parseLsTreeToTree", async (t) => {
  await t.step("parses complete git ls-tree output", () => {
    const output = outdent`
      040000 tree 773ff9d932fb2638d6b1fd54ebbce566c4b7797b	.github
      100644 blob b22fb8f98e5cbf0dd20136a732c5db76369a5499	.gitignore
      100644 blob 5bee15b6574b8de61da2a6981978109145d5201e	LICENSE
      040000 tree ca06869a17c3482a97ba2a9cd88224f5f488e482	src
      100644 blob 250f9dcf5b3fbf42d35ecac2f6060dd6e4af3316	src/main.ts
      100644 blob def456789abcdef0123456789abcdef012345678	src/utils.ts
    `;

    const tree = parseLsTreeToTree(output, "MyProject");
    
    assertEquals(tree.root.label, "MyProject");
    
    if ("children" in tree.root) {
      // Should have: .github, src, .gitignore, LICENSE
      assertEquals(tree.root.children.length, 4);
      
      // Folders first
      assertEquals(tree.root.children[0].label, ".github");
      assertEquals(tree.root.children[1].label, "src");
      
      // Then files
      assertEquals(tree.root.children[2].label, ".gitignore");
      assertEquals(tree.root.children[3].label, "LICENSE");
      
      // Check src folder has files
      if ("children" in tree.root.children[1]) {
        assertEquals(tree.root.children[1].children.length, 2);
        assertEquals(tree.root.children[1].children[0].label, "main.ts");
        assertEquals(tree.root.children[1].children[1].label, "utils.ts");
      }
    }
  });

  await t.step("handles recursive git ls-tree output", () => {
    const output = outdent`
      100644 blob 250f9dcf5b3fbf42d35ecac2f6060dd6e4af3316	.github/workflows/test.yml
      100644 blob b22fb8f98e5cbf0dd20136a732c5db76369a5499	.gitignore
      100644 blob 5bee15b6574b8de61da2a6981978109145d5201e	LICENSE
      100644 blob 42f31ac076d2afc2e311e6a9f7b2fb2958d812fc	autoload/gin/component/branch.vim
      100644 blob 6fbb35e88364160c4de7ec1ff7ea4217224f6b91	autoload/gin/component/traffic.vim
    `;

    const tree = parseLsTreeToTree(output);
    
    if ("children" in tree.root) {
      // Should have: .github, autoload, .gitignore, LICENSE
      assertEquals(tree.root.children.length, 4);
      
      // Check .github folder structure
      const githubFolder = tree.root.children[0];
      assertEquals(githubFolder.label, ".github");
      if ("children" in githubFolder) {
        assertEquals(githubFolder.children.length, 1);
        assertEquals(githubFolder.children[0].label, "workflows");
        
        if ("children" in githubFolder.children[0]) {
          assertEquals(githubFolder.children[0].children.length, 1);
          assertEquals(githubFolder.children[0].children[0].label, "test.yml");
        }
      }
      
      // Check autoload folder structure
      const autoloadFolder = tree.root.children[1];
      assertEquals(autoloadFolder.label, "autoload");
      if ("children" in autoloadFolder) {
        assertEquals(autoloadFolder.children.length, 1);
        assertEquals(autoloadFolder.children[0].label, "gin");
        
        if ("children" in autoloadFolder.children[0]) {
          assertEquals(autoloadFolder.children[0].children.length, 1);
          assertEquals(autoloadFolder.children[0].children[0].label, "component");
          
          if ("children" in autoloadFolder.children[0].children[0]) {
            assertEquals(autoloadFolder.children[0].children[0].children.length, 2);
            assertEquals(autoloadFolder.children[0].children[0].children[0].label, "branch.vim");
            assertEquals(autoloadFolder.children[0].children[0].children[1].label, "traffic.vim");
          }
        }
      }
    }
  });
});