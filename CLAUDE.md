# Coding Guidelines for vim-gin

## Comments

**All code comments MUST be written in English.**

This applies to:
- Function/class documentation comments
- Inline comments explaining logic
- TODO/FIXME/NOTE comments
- Any other comment in the codebase

### Rationale

- Ensures consistency across the codebase
- Makes the code accessible to international contributors
- Follows common open-source project conventions

### Examples

```typescript
// ✅ Good
// Disable visual features that affect line number display
await disableVisualLineModifications(denops, bufnr);

// ❌ Bad (using non-English comments)
// Disable visual line modifications
await disableVisualLineModifications(denops, bufnr);
```

```typescript
/**
 * ✅ Good
 * Parse git blame porcelain output
 * @param content - Raw output from git blame --porcelain
 * @returns Parsed blame result with commits and lines
 */

/**
 * ❌ Bad (using non-English comments)
 * Parse blame output
 * @param content - Blame output
 * @returns Parsed result
 */
```
