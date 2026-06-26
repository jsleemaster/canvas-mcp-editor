# Penpot Grid Multicell Merge Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like multi-cell Grid Area merge and split actions directly from the selected grid frame viewport.

**Architecture:** Extend the existing selected-grid cell hit zones and context menu rather than adding a separate canvas mode. Ctrl/Command-clicking grid cells stores a rectangular cell range in UI state; right-clicking the selected range writes a named `layout.grid_areas` span through the existing `set_node_layout` command path, and right-clicking an existing named area can remove that area from the parent grid.

**Tech Stack:** React, Playwright CLI, Vite, Layo renderer layout metadata.

---

## Penpot Reference

Reference capability: Penpot Flexible Layout Grid Area editing from the viewport.

Source: https://help.penpot.app/user-guide/designing/flexible-layouts/

Decision: **Adopt with Layo UI wording.** Penpot lets users select multiple grid cells and merge them into a Grid Area, then split/reset areas. Layo should keep Korean UI labels and deterministic `grid_areas` metadata, but the product behavior should be direct viewport editing rather than Inspector-only typing.

Maturity gate: Layout maturity.

## Failure Case

The previous slice only lets a selected grid frame right-click one cell and create `areaN:<column>/<row>/1/1`. It does not let users select multiple cells to create a span, and it does not provide a context-menu split action for an existing named area.

## File Map

- Modify: `apps/web/e2e/editor-mvp.spec.ts`
  - Add RED Playwright coverage for Ctrl/Command multi-cell range merge.
  - Add RED Playwright coverage for splitting an existing named grid area from the cell context menu.
- Modify: `apps/web/src/App.tsx`
  - Store selected grid cell range state.
  - Render a visible selected range overlay.
  - Extend the grid cell context menu with range-aware merge and area-aware split.
- Modify: `apps/web/src/styles.css`
  - Add selected grid range overlay styling.
- Modify: `docs/product/penpot-maturity-benchmark.md`
  - Move multi-cell merge/split from remaining layout gap to landed layout posture.
- Modify: `docs/superpowers/PLAN_STATUS.md`
  - Track this plan as active, then completed after verification.

## Acceptance Criteria

- [x] Ctrl/Command-clicking two cells in a selected grid frame shows `grid-cell-selection-range`.
- [x] Right-clicking inside the selected range opens `grid-cell-context-menu`.
- [x] Clicking `셀 병합 영역 만들기` creates a deterministic multi-cell area such as `area1:1/1/3/2`.
- [x] Right-clicking a cell inside an existing named area shows `병합 영역 분리`.
- [x] Clicking `병합 영역 분리` removes that named area from `layout.grid_areas`.
- [x] Focused Playwright CLI tests prove the visible viewport interactions.
- [x] `pnpm typecheck`, `pnpm --filter @layo/web build`, `pnpm test`, `pnpm test:e2e`, and `git diff --check` pass before PR.

## Tasks

### Task 1: RED Playwright Coverage

**Files:**
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [x] **Step 1: Add failing multi-cell merge and split tests**

Add tests beside the existing `canvas grid empty cell context menu creates a named area` test:

```ts
test("canvas grid multi-cell context menu creates a spanned named area", async ({ page }) => {
  await createProjectFromEmptyState(page);
  await page.getByRole("button", { name: "랜딩 프레임" }).click();
  await page.getByTestId("inspector-width").fill("420");
  await page.getByTestId("inspector-height").fill("240");
  await page.getByTestId("inspector-layout-mode").selectOption("grid");
  await page.getByTestId("inspector-layout-grid-column-tracks").fill("120px 80px 1fr");
  await page.getByTestId("inspector-layout-grid-row-tracks").fill("90px 90px");
  await page.getByTestId("inspector-layout-gap").fill("0");
  await page.getByTestId("inspector-layout-padding-top").fill("20");
  await page.getByTestId("inspector-layout-padding-right").fill("20");
  await page.getByTestId("inspector-layout-padding-bottom").fill("20");
  await page.getByTestId("inspector-layout-padding-left").fill("20");

  await page.getByTestId("grid-cell-hit-zone-1-1").click({ modifiers: ["ControlOrMeta"] });
  await page.getByTestId("grid-cell-hit-zone-3-2").click({ modifiers: ["ControlOrMeta"] });
  await expect(page.getByTestId("grid-cell-selection-range")).toBeVisible();

  await page.getByTestId("grid-cell-hit-zone-2-1").click({ button: "right" });
  const menu = page.getByTestId("grid-cell-context-menu");
  await expect(menu).toBeVisible();
  await menu.getByRole("menuitem", { name: "셀 병합 영역 만들기" }).click();
  await expect(page.getByTestId("inspector-layout-grid-areas")).toHaveValue("area1:1/1/3/2");
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid multi-cell context menu creates a spanned named area|canvas grid cell context menu splits an existing named area" --workers=1 --reporter=line
```

Expected: FAIL because `grid-cell-selection-range` and `병합 영역 분리` do not exist yet.

### Task 2: Implement Range-Aware Menu

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`

- [x] **Step 1: Add grid cell selection state**

Add a `GridCellSelectionState` with `anchor` and `focus` cell coordinates. Ctrl/Command-click starts or extends a rectangular range for the selected grid frame.

- [x] **Step 2: Render selected range overlay**

Calculate the bounding rectangle from `gridViewportOverlay.cellControls` and render a `grid-cell-selection-range` overlay.

- [x] **Step 3: Make merge range-aware**

When a context menu opens inside the current range, merge the full rectangle. Otherwise keep the existing single-cell merge behavior.

- [x] **Step 4: Add split action**

When a context menu opens on a cell covered by a named grid area, show `병합 영역 분리` and remove that area from the parent `grid_areas` list through `set_node_layout`.

- [x] **Step 5: Verify focused GREEN**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid multi-cell context menu creates a spanned named area|canvas grid cell context menu splits an existing named area" --workers=1 --reporter=line
```

Expected: PASS.

### Task 3: Product Docs And Full Verification

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [x] **Step 1: Update product docs**

Record multi-cell merge/split menus as landed and leave baseline alignment plus deeper resizing semantics as remaining layout gaps.

- [x] **Step 2: Run verification**

Run:

```bash
pnpm --filter @layo/web typecheck
pnpm typecheck
pnpm run check:penpot-maturity
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
git diff --check
```

- [ ] **Step 3: PR, merge, and cleanup**

Commit, push, create PR, inspect changed files, merge, sync `main`, delete local/remote feature branches, remove generated artifacts, stop dev servers, and verify ports `5173` and `4317` are clear.
