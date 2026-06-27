# Penpot File Version Retention Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file-version delete and retention cleanup controls so Layo history can be managed without losing pinned recovery checkpoints.

**Architecture:** Reuse the existing `.layo/history/<fileId>/<versionId>.json` sidecar store. Add a manual delete path for any saved version, including pinned versions, and add retention pruning that deletes only old unpinned versions after keeping the newest unpinned entries. Expose the same behavior through storage, HTTP, MCP, web API helpers, and the file panel.

**Tech Stack:** TypeScript, Fastify, MCP, React, Playwright CLI, Vitest.

---

## Penpot Comparison

Reference capability: Penpot workspace file history versions and autosave configuration. Layo adapts the behavior: pinned versions survive automated cleanup, manual delete remains possible, and retention cleanup is explicit/local-first rather than a server-wide hidden job.

## Files

- Modify: `apps/server/src/storage.ts`
  - Add `DeleteFileVersionResult`.
  - Add `PruneFileVersionsResult`.
  - Add `deleteFileVersion(fileId, versionId)`.
  - Add `pruneFileVersions(fileId, { keepUnpinned })`.
- Modify: `apps/server/src/storage.test.ts`
  - Add RED/GREEN coverage for deleting a pinned version manually.
  - Add RED/GREEN coverage for pruning old unpinned versions while pinned versions remain.
- Modify: `apps/server/src/http.ts`
  - Add `DELETE /files/:fileId/versions/:versionId`.
  - Add `POST /files/:fileId/versions/prune`.
- Modify: `apps/server/src/http.test.ts`
  - Add HTTP delete/prune coverage.
- Modify: `apps/server/src/mcp.ts`
  - Add `delete_file_version`.
  - Add `prune_file_versions`.
- Modify: `apps/server/src/mcp.test.ts`
  - Add MCP delete/prune coverage.
- Modify: `apps/web/src/document-api.ts`
  - Add `DeleteFileVersionResult`.
  - Add `PruneFileVersionsResult`.
  - Add `deleteFileVersion`.
  - Add `pruneFileVersions`.
- Modify: `apps/web/src/document-api.test.ts`
  - Add helper coverage for DELETE and prune POST calls.
- Modify: `apps/web/src/App.tsx`
  - Add file-panel delete action.
  - Add retention keep input and cleanup action.
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
  - Add Playwright CLI coverage for deleting one saved version and pruning old unpinned versions while a pinned checkpoint remains.
- Modify docs:
  - `docs/product/penpot-maturity-benchmark.md`
  - `docs/product/figma-feature-inventory.md`
  - `docs/product/team-collaboration-roadmap.md`
  - `docs/superpowers/PLAN_STATUS.md`

## Tasks

### Task 1: Storage Retention Semantics

- [x] **Step 1: Write failing storage tests**

Add storage coverage that proves:

```ts
const pinned = await storage.saveFileVersion("sample-file", { message: "고정 보관" });
await storage.setFileVersionPinned("sample-file", pinned.versionId, true);
await expect(storage.deleteFileVersion("sample-file", pinned.versionId)).resolves.toMatchObject({
  versionId: pinned.versionId,
  pinned: true,
  deleted: true
});
await expect(storage.listFileVersions("sample-file")).resolves.not.toContainEqual(
  expect.objectContaining({ versionId: pinned.versionId })
);
```

And:

```ts
const protectedVersion = await storage.saveFileVersion("sample-file", { message: "릴리즈 기준" });
await storage.setFileVersionPinned("sample-file", protectedVersion.versionId, true);
const oldVersion = await storage.saveFileVersion("sample-file", { message: "오래된 작업" });
await storage.updateText("sample-file", "text-1", "최신 작업");
const newestVersion = await storage.saveFileVersion("sample-file", { message: "최신 작업" });

const pruned = await storage.pruneFileVersions("sample-file", { keepUnpinned: 1 });
expect(pruned.deletedVersions).toEqual([expect.objectContaining({ versionId: oldVersion.versionId })]);
expect(await storage.listFileVersions("sample-file")).toEqual(
  expect.arrayContaining([
    expect.objectContaining({ versionId: protectedVersion.versionId, pinned: true }),
    expect.objectContaining({ versionId: newestVersion.versionId, pinned: false })
  ])
);
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm exec vitest run src/storage.test.ts -t "file version retention"
```

Expected: FAIL because `deleteFileVersion` and `pruneFileVersions` do not exist.

- [x] **Step 3: Implement storage delete and prune**

Add:

```ts
export interface DeleteFileVersionResult extends StoredFileVersionSummary {
  deleted: true;
}

export interface PruneFileVersionsResult {
  fileId: string;
  keepUnpinned: number;
  deletedVersions: StoredFileVersionSummary[];
  keptVersions: StoredFileVersionSummary[];
}
```

Implement `deleteFileVersion` by reading the version summary first, unlinking the sidecar, and returning `{ ...summary, deleted: true }`.

Implement `pruneFileVersions` by keeping all pinned versions and the newest `keepUnpinned` unpinned versions, deleting the remaining unpinned sidecars.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm exec vitest run src/storage.test.ts -t "file version retention"
```

Expected: PASS.

### Task 2: HTTP, MCP, And Web API

- [x] **Step 1: Write failing HTTP, MCP, and web API tests**

Add tests for:

```ts
DELETE /files/sample-file/versions/:versionId
POST /files/sample-file/versions/prune
```

MCP tools:

```ts
delete_file_version
prune_file_versions
```

Web helpers:

```ts
await deleteFileVersion("sample-file", "version-1", fetcher as typeof fetch);
await pruneFileVersions("sample-file", 1, fetcher as typeof fetch);
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm exec vitest run src/http.test.ts -t "file version retention"
pnpm exec vitest run src/mcp.test.ts -t "file version retention"
pnpm exec vitest run src/document-api.test.ts -t "file version retention"
```

Expected: FAIL because routes/tools/helpers do not exist.

- [x] **Step 3: Implement HTTP, MCP, and web helpers**

Add:

```ts
server.delete<{ Params: { fileId: string; versionId: string } }>(
  "/files/:fileId/versions/:versionId",
  async (request) => ({ version: await storage.deleteFileVersion(request.params.fileId, request.params.versionId) })
);

server.post<{ Params: { fileId: string }; Body: { keepUnpinned?: number } }>(
  "/files/:fileId/versions/prune",
  async (request) => ({ result: await storage.pruneFileVersions(request.params.fileId, { keepUnpinned: request.body.keepUnpinned ?? 10 }) })
);
```

Add matching MCP and web API helpers using the same response shapes.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm exec vitest run src/http.test.ts -t "file version retention"
pnpm exec vitest run src/mcp.test.ts -t "file version retention"
pnpm exec vitest run src/document-api.test.ts -t "file version retention"
```

Expected: PASS.

### Task 3: File Panel Controls And Docs

- [x] **Step 1: Add RED Playwright coverage**

Add `file version retention deletes and prunes saved versions`:

- Create a project.
- Save versions `릴리즈 기준`, `오래된 작업`, and `최신 작업`.
- Pin `릴리즈 기준`.
- Delete `최신 작업` from its row and verify it disappears.
- Set retention keep input to `1`.
- Save one more unpinned version so there are two unpinned candidates.
- Click `오래된 버전 정리`.
- Verify `릴리즈 기준` remains with `고정됨`, newest unpinned remains, and older unpinned disappears.

- [x] **Step 2: Implement UI controls**

Add `fileVersionRetentionKeep` state, a numeric input in the file-version panel, a row-level `삭제` button, and a panel action `오래된 버전 정리`.

- [x] **Step 3: Update docs**

Record that manual delete and explicit retention cleanup exist, while full visual preview and branch/review/merge remain open gaps.

- [x] **Step 4: Full verification**

Run:

```bash
git diff --check
pnpm run check:design-rules
pnpm run check:penpot-maturity
pnpm --filter @layo/web typecheck
pnpm --filter @layo/server typecheck
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
```

Expected: PASS.

Verification evidence from this implementation:

- RED storage: `pnpm exec vitest run src/storage.test.ts -t "file version retention"` failed because `deleteFileVersion` did not exist.
- RED HTTP: `pnpm exec vitest run src/http.test.ts -t "file version retention"` failed because the DELETE route returned 404.
- RED MCP: `pnpm exec vitest run src/mcp.test.ts -t "file version retention"` failed because `delete_file_version` was unknown.
- RED web API: `pnpm exec vitest run src/document-api.test.ts -t "file version retention"` failed because `deleteFileVersion` was not exported.
- RED Playwright CLI: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "file version retention deletes and prunes saved versions" --workers=1 --reporter=line` failed waiting for `최신 작업 삭제`.
- GREEN focused checks passed:
  - `pnpm exec vitest run src/storage.test.ts -t "file version retention"`
  - `pnpm exec vitest run src/http.test.ts -t "file version retention"`
  - `pnpm exec vitest run src/mcp.test.ts -t "file version retention"`
  - `pnpm exec vitest run src/document-api.test.ts -t "file version retention"`
  - `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "file version retention deletes and prunes saved versions" --workers=1 --reporter=line`
- Full gates passed:
  - `git diff --check`
  - `pnpm run check:design-rules`
  - `pnpm run check:penpot-maturity`
  - `pnpm --filter @layo/web typecheck`
  - `pnpm --filter @layo/server typecheck`
  - `pnpm --filter @layo/web build`
  - `pnpm test`
  - `pnpm test:e2e`

- [ ] **Step 5: Publish and cleanup**

Commit, push, create PR through GitHub REST API, merge after verification, then sync `main`, remove the feature worktree and branches, stop dev servers, and verify ports `4317` and `5173` are clear.
