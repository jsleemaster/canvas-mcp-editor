# File Archive Web Import Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-visible Layo file archive export/import controls with a server-validated import review step before writing imported files.

**Architecture:** Adopt Penpot's file import/export shape at the UX level while adapting the file format to Layo's standard ZIP archive. The server owns ZIP parsing and validation, exposes a no-write review endpoint, and the web app shows the review summary before calling the existing import route. The UI stays in the existing file/project panel so the workflow is discoverable beside project and history controls.

**Tech Stack:** Fastify, FileStorage, Vite React, Vitest, Playwright CLI, Layo ZIP archive format.

---

## Penpot Reference

- Source: https://help.penpot.app/user-guide/export-import/export-import-files/
- Adopt: user-visible file export/import, import from project/file management area, and review before import.
- Adapt: Layo imports `.layo.zip` archives instead of Penpot `.penpot` files; the review is server-validated because the server already owns safe ZIP parsing and asset validation.
- Gate: Import/export maturity in `docs/product/penpot-maturity-benchmark.md`.

## File Structure

- Modify `apps/server/src/storage.ts`
  - Add `ReviewedFileArchive` type.
  - Add `reviewFileArchive(archive)` that parses the ZIP and returns no-write summary.
  - Reuse shared parsing/asset validation helpers so review and import cannot disagree.
- Modify `apps/server/src/storage.test.ts`
  - Add RED test proving review returns original id/name, page count, node count, and asset count without writing the file.
- Modify `apps/server/src/http.ts`
  - Add `POST /files/import/archive/review`.
- Modify `apps/server/src/http.test.ts`
  - Add RED test proving the review route returns summary and does not create the file.
- Modify `apps/web/src/document-api.ts`
  - Add archive helper types and `reviewFileArchive`, `importFileArchive`, `exportFileArchive`.
- Modify `apps/web/src/document-api.test.ts`
  - Add RED tests for helper request shape and binary export handling.
- Modify `apps/web/src/App.tsx`
  - Add archive import state, hidden file input, export button, select-file button, review panel, import/cancel actions.
  - After confirm import, refresh project list and load the imported file through a generated project shell.
- Modify `apps/web/src/styles.css`
  - Add compact archive review panel styles if existing project/file-version styles are not enough.
- Modify `apps/web/e2e/editor-mvp.spec.ts`
  - Add Playwright CLI flow: create project, export archive, choose archive file, see review summary, confirm import, verify imported project/file opens.
- Modify docs
  - `docs/product/penpot-maturity-benchmark.md`
  - `docs/product/team-collaboration-roadmap.md`
  - `docs/superpowers/PLAN_STATUS.md`

## Task 1: Server Archive Review Contract

**Files:**
- Modify: `apps/server/src/storage.test.ts`
- Modify: `apps/server/src/storage.ts`

- [x] **Step 1: Write the failing storage test**

Add a test near the existing file archive test:

```ts
test("reviews a file archive without writing the imported file", async () => {
  tempRoot = await mkdtemp(path.join(tmpdir(), "layo-"));
  const source = await storageWithDocument(path.join(tempRoot, "source"));
  const exported = await source.exportFileArchive("sample-file");
  const target = new FileStorage(path.join(tempRoot, "target"));

  const review = await target.reviewFileArchive(exported.archive);

  expect(review).toMatchObject({
    originalFileId: "sample-file",
    originalName: "테스트 문서",
    suggestedName: "테스트 문서",
    assetCount: 0,
    pageCount: 1,
    nodeCount: expect.any(Number)
  });
  await expect(target.readFile("sample-file")).rejects.toThrow();
});
```

- [x] **Step 2: Run RED**

Run:

```bash
pnpm --filter @layo/server test -- src/storage.test.ts -t "reviews a file archive"
```

Expected: FAIL because `reviewFileArchive` is not a function.

- [x] **Step 3: Implement minimal storage review**

Add `ReviewedFileArchive`, parse manifest/document, verify id and asset count, count pages/nodes, and return:

```ts
{
  originalFileId: manifest.fileId,
  originalName: manifest.name,
  suggestedName: archivedDocument.name,
  assetCount: assetIds.length,
  pageCount: archivedDocument.pages.length,
  nodeCount: countDocumentNodes(archivedDocument)
}
```

Do not call `writeFile` or `writeAsset`.

- [x] **Step 4: Run GREEN**

Run:

```bash
pnpm --filter @layo/server test -- src/storage.test.ts -t "reviews a file archive"
```

Expected: PASS.

## Task 2: HTTP Review Route

**Files:**
- Modify: `apps/server/src/http.test.ts`
- Modify: `apps/server/src/http.ts`

- [x] **Step 1: Write the failing HTTP test**

Add a test near the existing archive route test:

```ts
const review = await targetServer.inject({
  method: "POST",
  url: "/files/import/archive/review",
  payload: { archiveBase64: exported.rawPayload.toString("base64") }
});

expect(review.statusCode).toBe(200);
expect(review.json().review).toMatchObject({
  originalFileId: "archive-file",
  originalName: "HTTP 아카이브",
  assetCount: 1,
  pageCount: 1
});
const missing = await targetServer.inject({ method: "GET", url: "/files/archive-file" });
expect(missing.statusCode).toBe(404);
```

- [x] **Step 2: Run RED**

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts -t "reviews a file archive"
```

Expected: FAIL with 404 for `/files/import/archive/review`.

- [x] **Step 3: Add route**

Add:

```ts
server.post<{ Body: { archiveBase64: string } }>("/files/import/archive/review", async (request) => {
  return {
    review: await storage.reviewFileArchive(Buffer.from(request.body.archiveBase64, "base64"))
  };
});
```

- [x] **Step 4: Run GREEN**

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts -t "reviews a file archive"
```

Expected: PASS.

## Task 3: Web API Helpers

**Files:**
- Modify: `apps/web/src/document-api.test.ts`
- Modify: `apps/web/src/document-api.ts`

- [x] **Step 1: Write failing helper tests**

Add tests that assert:

- `reviewFileArchive("base64")` posts to `/files/import/archive/review`.
- `importFileArchive({ archiveBase64, fileId, name })` posts to `/files/import/archive`.
- `exportFileArchive("document-1")` fetches `/files/document-1/export/archive` and returns `{ blob, fileName }` from `Content-Disposition`.

- [x] **Step 2: Run RED**

Run:

```bash
pnpm --filter @layo/web test -- src/document-api.test.ts -t "file archive"
```

Expected: FAIL because helpers are missing.

- [x] **Step 3: Implement helpers**

Use existing `readDocumentJson(response)` for JSON endpoints. For export, check `response.ok`, parse filename from `Content-Disposition`, and return a Blob.

- [x] **Step 4: Run GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/document-api.test.ts -t "file archive"
```

Expected: PASS.

## Task 4: Web Project Panel UI

**Files:**
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Write failing Playwright test**

Add a test:

```ts
test("file panel exports a Layo archive and reviews it before import", async ({ page }) => {
  const { documentId } = await createProjectFromEmptyState(page);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "현재 파일 아카이브 내보내기" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`${documentId}.layo.zip`);
  const archivePath = await download.path();
  if (!archivePath) throw new Error("archive download path missing");

  await page.getByTestId("file-archive-upload").setInputFiles(archivePath);
  const review = page.getByTestId("file-archive-review");
  await expect(review).toContainText("가져오기 전 검토");
  await expect(review).toContainText("새 문서");
  await expect(review).toContainText("페이지 1개");

  await page.getByTestId("file-archive-import-name").fill("아카이브 복원본");
  await page.getByRole("button", { name: "검토한 아카이브 가져오기" }).click();
  await expect(page.getByTestId("project-status")).toContainText("아카이브 복원본 가져옴");
  await expect(page.getByTestId("project-name")).toHaveValue("아카이브 복원본");
});
```

- [x] **Step 2: Run RED**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "file panel exports a Layo archive" --workers=1 --reporter=line
```

Expected: FAIL because the archive buttons/input/review panel are missing.

- [x] **Step 3: Implement UI**

Add:

- `archiveImportReview`, `archiveImportName`, `archiveImportBase64`, `archiveStatus` state.
- `archiveFileInputRef`.
- `downloadCurrentFileArchive()`.
- `reviewSelectedFileArchive(event)`.
- `importReviewedFileArchive()`.
- hidden `<input data-testid="file-archive-upload" accept=".zip,.layo.zip,application/zip,application/vnd.layo.file-archive+zip">`.
- project panel controls:
  - "현재 파일 아카이브 내보내기"
  - "아카이브 파일 선택"
  - review panel with `data-testid="file-archive-review"`
  - name input `data-testid="file-archive-import-name"`
  - "검토한 아카이브 가져오기"
  - "가져오기 취소"

For imported files, create a new local project shell named after the import result and pointing at the imported file, then load it so the user sees the imported document.

- [x] **Step 4: Run GREEN**

Run the same Playwright command. Expected: PASS.

## Task 5: Docs, Gates, and PR

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/product/team-collaboration-roadmap.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [x] **Step 1: Update docs**

Record that Layo now has visible web controls and import review for single-file archives, while multi-file project archives, shared libraries, and Penpot/Figma migration remain open.

- [x] **Step 2: Run verification**

Run:

```bash
pnpm --filter @layo/server test -- src/storage.test.ts src/http.test.ts
pnpm --filter @layo/web test -- src/document-api.test.ts
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "file panel exports a Layo archive" --workers=1 --reporter=line
pnpm --filter @layo/server typecheck
pnpm --filter @layo/web typecheck
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm --filter @layo/web build
git diff --check
pnpm test
```

- [ ] **Step 3: Commit, push, PR, merge, cleanup**

Use `git` plus GitHub REST API instead of `gh`. Do not add `evar-leeo` as reviewer. After merge, follow `docs/process/post-merge-cleanup.md`.

## Execution Evidence

- RED storage: `pnpm --filter @layo/server test -- src/storage.test.ts -t "reviews a file archive"` failed before `reviewFileArchive` existed.
- GREEN storage: `pnpm --filter @layo/server test -- src/storage.test.ts -t "reviews a file archive"` passed.
- RED HTTP: `pnpm --filter @layo/server test -- src/http.test.ts -t "reviews file archive"` failed with missing `/files/import/archive/review`.
- GREEN HTTP: `pnpm --filter @layo/server test -- src/http.test.ts -t "reviews file archive"` passed.
- RED web API: `pnpm --filter @layo/web test -- src/document-api.test.ts -t "file archive"` failed before archive helpers existed.
- GREEN web API: `pnpm --filter @layo/web test -- src/document-api.test.ts -t "file archive"` passed.
- RED Playwright CLI: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "file panel exports a Layo archive" --workers=1 --reporter=line` failed waiting for the missing `현재 파일 아카이브 내보내기` button.
- GREEN Playwright CLI: the same command passed after file-panel UI implementation.
- Focused server verification: `pnpm --filter @layo/server test -- src/storage.test.ts src/http.test.ts` passed.
- Focused web verification: `pnpm --filter @layo/web test -- src/document-api.test.ts` passed.
- Typechecks: `pnpm --filter @layo/server typecheck` and `pnpm --filter @layo/web typecheck` passed.
- Product gates: `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, and `git diff --check` passed.
- Build and full test: `pnpm --filter @layo/web build` and `pnpm test` passed.
