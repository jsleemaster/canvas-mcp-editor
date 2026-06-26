# Penpot File Version History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Penpot-inspired saved file version history so teams can create named snapshots, inspect them, and restore a design file after a mistake.

**Architecture:** Reuse Layo's local-first `.layo` storage, HTTP routes, MCP tool pattern, and left file/project panel. Store immutable snapshots under `.layo/history/<fileId>/<versionId>.json`; restore writes the selected snapshot back to the normal design file path while first saving the pre-restore state for recovery.

**Tech Stack:** TypeScript, Fastify, MCP SDK, Vite React, Vitest, Playwright CLI.

---

## Penpot Comparison

- Reference capability: Penpot treats History as a team-product recovery workflow with saved file versions and restore affordances.
- Decision: Adapt. Layo keeps local-first filesystem storage and deterministic MCP/HTTP access instead of Penpot's backend model.
- Maturity gate: Gate 2, Team workflow; Gate 9, Agent safety.
- Initial slice: manual saved versions, list/read/restore via storage, HTTP, MCP, and web UI.
- Later gaps: automatic edit versions, pinned versions, richer visual diff, branch/review workflow.

## Files

- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/http.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `apps/server/src/storage.test.ts`
- Modify: `apps/server/src/http.test.ts`
- Modify: `apps/server/src/mcp.test.ts`
- Modify: `apps/web/src/document-api.ts`
- Modify: `apps/web/src/document-api.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/styles.css`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Task 1: Storage Version Snapshots

- [x] **Step 1: Write failing storage tests**

Add tests proving:

```ts
const version = await storage.saveFileVersion("sample-file", { message: "검토 전" });
expect(version.fileId).toBe("sample-file");
expect(version.message).toBe("검토 전");
expect(version.nodeCount).toBeGreaterThan(0);

await storage.updateText("sample-file", "text-1", "변경됨");
const restored = await storage.restoreFileVersion("sample-file", version.versionId);
expect(findTextValue(restored.file, "text-1")).toBe("Layo");
expect((await storage.listFileVersions("sample-file")).map((item) => item.source)).toContain("restore");
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/server test -- src/storage.test.ts -t "file versions"
```

Expected: FAIL because `saveFileVersion`, `listFileVersions`, `readFileVersion`, and `restoreFileVersion` do not exist.

- [x] **Step 3: Implement minimal storage**

Add `StoredFileVersionSummary`, `StoredFileVersion`, safe history paths, snapshot JSON parsing, `saveFileVersion`, `listFileVersions`, `readFileVersion`, and `restoreFileVersion`.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @layo/server test -- src/storage.test.ts -t "file versions"
```

Expected: PASS.

## Task 2: HTTP and MCP Surfaces

- [x] **Step 1: Write failing HTTP and MCP tests**

Add tests proving:

```ts
POST /files/sample-file/versions
GET /files/sample-file/versions
GET /files/sample-file/versions/:versionId
POST /files/sample-file/versions/:versionId/restore
```

and MCP tools:

```ts
save_file_version
list_file_versions
get_file_version
restore_file_version
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts src/mcp.test.ts -t "file version"
```

Expected: FAIL with missing route/tool behavior.

- [x] **Step 3: Implement routes and tools**

Expose version summaries without full document payloads by default, expose a single version snapshot for preview, and make restore a write/destructive MCP tool.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts src/mcp.test.ts -t "file version"
```

Expected: PASS.

## Task 3: Web History Panel

- [x] **Step 1: Write failing web API and Playwright tests**

Add `document-api` tests for list/save/read/restore helpers. Add Playwright coverage that opens the file panel, saves a named version, changes text, restores the saved version, and verifies the text returns in the canvas and persisted API document.

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/web test -- src/document-api.test.ts -t "file version"
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "file version history" --workers=1 --reporter=line
```

Expected: FAIL because UI/API helpers do not exist.

- [x] **Step 3: Implement minimal UI**

Add a Korean-first `버전 기록` section to the file/project panel with message input, save button, refresh button, list summaries, preview metadata, and restore buttons. Reload the document and version list after restore.

- [x] **Step 4: Verify GREEN**

Run the same focused web API and Playwright commands. Expected: PASS.

## Task 4: Docs and Full Verification

- [x] Update the Penpot maturity benchmark and plan status with the new history/recovery posture and remaining gaps.
- [x] Run focused server/web tests.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm run check:penpot-maturity`.
- [x] Run `pnpm --filter @layo/web build`.
- [x] Run `pnpm test`.
- [x] Run `pnpm test:e2e`.
- [x] Run `git diff --check`.
- [ ] Commit, push, create PR, merge, and perform post-merge cleanup.

## Verification Evidence

- RED: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "file version history" --workers=1 --reporter=line` failed on missing `file-version-message`.
- RED after UI: the same Playwright case exposed that inspector text edits were not persisted to the saved file before restore.
- GREEN focused: `pnpm --filter @layo/server test -- src/storage.test.ts src/http.test.ts src/mcp.test.ts -t "file version"`.
- GREEN focused: `pnpm --filter @layo/web test -- src/document-api.test.ts -t "file version"`.
- GREEN focused: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "file version history" --workers=1 --reporter=line`.
- Direct Playwright CLI proof: `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "file version history" --workers=1 --reporter=line`.
- Full gates: `pnpm typecheck`, `pnpm run check:penpot-maturity`, `pnpm --filter @layo/web build`, `pnpm test`, `pnpm test:e2e`, and `git diff --check`.
