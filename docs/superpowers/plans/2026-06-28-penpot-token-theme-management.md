# Penpot Token Theme Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add document-local token theme creation, editing, membership management, and deletion so Layo moves beyond imported-theme activation toward Penpot-like theme management.

**Architecture:** Reuse the existing `DesignTokenTheme` model and active-token resolver. Add server/agent commands for upsert/delete, add undo/redo-safe web state snapshots, and extend the existing Inspector token section instead of introducing a separate modal.

**Tech Stack:** TypeScript, React, Fastify, Zod, Vitest, Playwright CLI, Node test runner.

---

## Penpot Gap

- Source: https://help.penpot.app/user-guide/design-systems/design-tokens/
- Capability: designers can create, edit, enable, disable, and delete token themes that select token sets for contexts such as mode, brand, or platform.
- Layo decision: adopt the document-local management semantics and adapt the UI to the compact right Inspector. Defer full visual matrix, drag reorder, and hosted library sync.
- Maturity gate: Design systems.

### Task 1: Server Agent And MCP Commands

**Files:**
- Modify: `apps/server/src/agent-control.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `apps/server/src/http.test.ts`

- [x] **Step 1: Write RED server tests**

Add a test named `agent commands manage token themes without raw DTCG edits` that:
- imports token sets/tokens,
- calls `upsert_token_theme` to create `theme-high-contrast`,
- calls `set_token_theme_enabled`,
- binds a fill token and verifies materialized fill,
- calls `upsert_token_theme` again to rename/change membership,
- calls `delete_token_theme`,
- verifies inspection and saved file state.

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts -t "token themes"
```

Expected: FAIL because `upsert_token_theme` and `delete_token_theme` are not accepted commands.

- [x] **Step 2: Implement server behavior**

Add `upsert_token_theme` and `delete_token_theme` to `AgentCommand`, `applySingleCommand`, and the MCP command schema. Upsert must trim name/group, normalize `token_set_ids`, reject empty id/name, reject missing token sets, update an existing theme by id, append if missing, and when an enabled theme is saved in a group, disable enabled siblings in the same group before materializing token bindings. Delete must remove the theme by id and materialize bindings.

- [x] **Step 3: Verify GREEN**

Run the same focused server command and expect PASS.

### Task 2: Web State Commands

**Files:**
- Modify: `apps/web/src/editor-state.ts`
- Modify: `apps/web/src/editor-state.test.ts`

- [x] **Step 1: Write RED web tests**

Add a reducer test named `manages token themes with undo redo and rematerialized bindings` that:
- creates a new theme from token sets,
- enables it,
- edits membership from `light` to `dark`,
- verifies bound fill rematerializes,
- deletes the theme,
- verifies undo restores the theme and fill.

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "manages token themes"
```

Expected: FAIL because the editor commands do not exist.

- [x] **Step 2: Implement web reducer behavior**

Add `upsert_token_theme`, `delete_token_theme`, and `set_document_token_themes`. Reuse the existing materialization helper and snapshot theme arrays for undo/redo.

- [x] **Step 3: Verify GREEN**

Run the same focused web command and expect PASS.

### Task 3: Inspector Theme Management UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [x] **Step 1: Write RED Playwright CLI test**

Add a test named `right inspector creates edits and deletes token themes` that imports base/light/dark token sets, creates a theme from the Inspector, selects token sets, enables it, verifies a bound fill updates, edits the theme name/group, deletes it, and verifies it disappears from the saved file.

Run:

```bash
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts --workers=1 --reporter=line --grep "creates edits and deletes token themes"
```

Expected: FAIL because no Inspector theme management controls exist.

- [x] **Step 2: Implement Inspector controls**

Extend `InspectorTokenControls` with a compact theme management card:
- add button `테마 추가`,
- per-theme name input,
- per-theme group input,
- enabled checkbox,
- token-set membership checkboxes,
- delete button `테마 삭제`.

Persist edits through `apply_agent_commands` using `upsert_token_theme`, `delete_token_theme`, and existing `set_token_theme_enabled`.

- [x] **Step 3: Verify GREEN**

Run the focused Playwright CLI command and expect PASS.

### Task 4: Docs, Gates, Publish

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`
- Modify: `docs/superpowers/plans/2026-06-28-penpot-token-theme-management.md`

- [x] **Step 1: Update docs**

Record token theme management as landed and leave visual matrix, reorder, and hosted sync as remaining gaps.

- [x] **Step 2: Run gates**

Run:

```bash
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm typecheck
pnpm test
pnpm --filter @layo/web build
pnpm test:e2e
git diff --check
```

Expected: all PASS.

- [ ] **Step 3: Commit, push, PR, merge, cleanup**

Commit with `feat: manage token themes`, push, create PR via GitHub REST, merge via GitHub REST if rules permit, then run post-merge cleanup.

## Evidence

- RED server: `pnpm --filter @layo/server test -- src/http.test.ts -t "agent commands manage token themes"` failed before `upsert_token_theme`/`delete_token_theme` were accepted.
- GREEN server: `pnpm --filter @layo/server test -- src/http.test.ts -t "agent commands manage token themes"` passed with 7 files and 125 tests.
- RED web reducer: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "manages token themes"` failed because `applyCommand` returned no result for the missing command.
- GREEN web reducer: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "manages token themes"` passed with 15 files and 151 tests.
- RED Playwright CLI: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts --workers=1 --reporter=line --grep "creates edits and deletes token themes"` failed waiting for `token-theme-add`.
- GREEN Playwright CLI: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts --workers=1 --reporter=line --grep "creates edits and deletes token themes"` passed.
- Regression Playwright CLI: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts --workers=1 --reporter=line --grep "activates imported DTCG token themes"` passed.
- Focused web typecheck: `pnpm --filter @layo/web typecheck` passed.
- Broad gates passed: `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, `pnpm typecheck`, `pnpm test`, `pnpm --filter @layo/web build`, `pnpm test:e2e` with 131 passing tests, and `git diff --check`.
