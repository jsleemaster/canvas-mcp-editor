# Penpot Token Theme Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Penpot-inspired token theme matrix to Layo's right Inspector so teams can scan and edit theme-to-token-set membership across grouped themes.

**Architecture:** Reuse the existing token theme document model and `upsert_token_theme` UI persistence path. Add a compact matrix view above the existing detailed theme rows, with checkboxes for membership and badges for included-set priority.

**Tech Stack:** React, TypeScript, Playwright CLI, existing Layo editor state and HTTP persistence.

---

## File Structure

- Modify `apps/web/e2e/editor-mvp.spec.ts` to add the RED/GREEN browser-visible token theme matrix regression.
- Modify `apps/web/src/App.tsx` to render the matrix in `InspectorTokenControls` and reuse existing `updateTokenThemeSetMembership`.
- Modify `apps/web/src/styles.css` for stable matrix layout inside the Inspector.
- Modify `docs/product/penpot-maturity-benchmark.md` and `docs/superpowers/PLAN_STATUS.md` after verification.

## Minimal Change Ladder

1. The behavior needs to exist because `visual theme matrix management` is an explicit design-system maturity gap.
2. Layo already has token themes, grouped rows, token-set membership, and ordered priority controls.
3. Native table/checkbox semantics are sufficient for the matrix.
4. The existing `upsert_token_theme` path is reused; no new command or schema is required.
5. New code is limited to the visible Inspector matrix, CSS, and regression coverage.

### Task 1: RED Playwright Coverage

**Files:**
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [x] **Step 1: Add a failing matrix test**

Add a test after the existing token theme reorder test:

```ts
test("right inspector edits token theme membership through a matrix", async ({ page }) => {
  const { documentId } = await createProjectFromEmptyState(page);
  const importedTokenJson = JSON.stringify(
    {
      $metadata: {
        tokenSetOrder: ["base", "light", "dark"],
        activeThemes: ["theme-review"]
      },
      $themes: [
        { id: "theme-review", name: "Review", group: "mode", selectedTokenSets: ["base", "light"] },
        { id: "theme-alt", name: "Alt", group: "preview", selectedTokenSets: ["base"] }
      ],
      base: { Surface: { Canvas: { $type: "color", $value: "#f8fafc" } } },
      light: { Surface: { Canvas: { $type: "color", $value: "#ffffff" } } },
      dark: { Surface: { Canvas: { $type: "color", $value: "#0f172a" } } }
    },
    null,
    2
  );

  await page.getByTestId("dtcg-token-json").fill(importedTokenJson);
  await page.getByRole("button", { name: "토큰 가져오기" }).click();
  await expect(page.getByTestId("dtcg-token-status")).toContainText("3개 토큰 가져옴");

  const agentResponse = await page.request.post(`http://127.0.0.1:4317/files/${documentId}/agent/commands`, {
    data: {
      dryRun: false,
      commands: [{ type: "set_fill_token", nodeId: "text-1", tokenId: "color-base-surface-canvas" }]
    }
  });
  expect(agentResponse.ok()).toBeTruthy();

  await page.reload();
  await openFilePanel(page);
  await page.getByRole("button", { name: "헤드라인" }).click();
  await expect(page.getByTestId("inspector-fill")).toHaveValue("#ffffff");

  await expect(page.getByTestId("token-theme-matrix")).toBeVisible();
  await expect(page.getByTestId("token-theme-matrix-group-mode")).toContainText("mode");
  await expect(page.getByTestId("token-theme-matrix-row-theme-review")).toContainText("Review");
  await expect(page.getByTestId("token-theme-matrix-priority-theme-review-base")).toHaveText("1");
  await expect(page.getByTestId("token-theme-matrix-priority-theme-review-light")).toHaveText("2");
  await expect(page.getByTestId("token-theme-matrix-cell-theme-review-dark")).not.toBeChecked();

  await page.getByTestId("token-theme-matrix-cell-theme-review-dark").check();
  await expect(page.getByTestId("inspector-fill")).toHaveValue("#0f172a");

  await expect
    .poll(async () => {
      const fileResponse = await page.request.get(`http://127.0.0.1:4317/files/${documentId}`);
      expect(fileResponse.ok()).toBeTruthy();
      const file = (await fileResponse.json()).file;
      const reviewTheme = file.token_themes.find((theme: { id: string }) => theme.id === "theme-review");
      return {
        reviewSets: reviewTheme.token_set_ids,
        fill: file.pages[0].children[0].children[0].style.fill
      };
    })
    .toEqual({
      reviewSets: ["base", "light", "dark"],
      fill: "#0f172a"
    });
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "theme membership through a matrix" --reporter=line
```

Expected: FAIL because `token-theme-matrix` does not exist.

Observed: FAIL with `getByTestId('token-theme-matrix')` not found.

### Task 2: Matrix UI

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Add matrix rendering**

In `InspectorTokenControls`, render a `token-theme-matrix` block when both token sets and token themes exist. Use existing `themesByGroup`, `tokenSets`, and `updateTokenThemeSetMembership`.

- [x] **Step 2: Add stable matrix styling**

Add CSS classes for `.token-theme-matrix`, `.token-theme-matrix-scroll`, `.token-theme-matrix-table`, `.token-theme-matrix-priority`, and related cells. The table should scroll horizontally instead of squeezing text into unreadable cells.

- [x] **Step 3: Verify GREEN**

Run:

```bash
node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "theme membership through a matrix" --reporter=line
```

Expected: PASS.

Observed: PASS.

### Task 3: Documentation And Full Verification

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`
- Modify: `docs/superpowers/plans/2026-06-28-penpot-token-theme-matrix.md`

- [x] **Step 1: Update maturity docs**

Record that visual token theme matrix management is now implemented and that remaining gaps are `variant-area/source override preservation` and `hosted theme/library registry sync`.

- [x] **Step 2: Run focused and full gates**

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

Expected: all pass.

Observed:

- `pnpm run check:penpot-maturity`: pass.
- `pnpm run check:design-rules`: pass after replacing one raw CSS spacing value with `var(--editor-space-xxs)`.
- `pnpm typecheck`: pass.
- `pnpm test`: pass, including `cargo test --workspace`.
- `pnpm --filter @layo/web build`: pass.
- `pnpm test:e2e`: 133 passed.
- `DEBUG=pw:api node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "theme membership through a matrix" --workers=1 --reporter=line`: pass; API log shows importing DTCG JSON, selecting `헤드라인`, verifying the matrix, checking the `theme-review`/`dark` cell, and verifying the fill rematerializes to `#0f172a`.
- `git diff --check`: pass.

- [x] **Step 3: Commit and publish**

Run:

```bash
git add apps/web/e2e/editor-mvp.spec.ts apps/web/src/App.tsx apps/web/src/styles.css docs/product/penpot-maturity-benchmark.md docs/superpowers/PLAN_STATUS.md docs/superpowers/plans/2026-06-28-penpot-token-theme-matrix.md docs/superpowers/specs/2026-06-28-penpot-token-theme-matrix-design.md
git commit -m "feat: add token theme matrix"
git push -u origin codex/token-theme-matrix
```

Open and merge the PR with GitHub REST, then run the post-merge cleanup process.
