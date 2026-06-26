# Penpot Grid Span Area Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like viewport grid track reordering semantics for spanned grid items and named grid areas.

**Architecture:** Reuse the existing `reorder_grid_track_with_children` command and replace the current span/area guard with a placement remapper. When a row or column moves, every occupied track index in a span is mapped through the same track move; the item or named area is then materialized as the smallest contiguous span that contains the moved track set. Named-area children keep their `grid_area` binding while the area definition moves.

**Tech Stack:** React, TypeScript, Vitest, Playwright CLI, Layo renderer document model.

---

## Penpot Reference

- Source: Penpot Flexible Layouts, Grid Layout > Design viewport > Drag columns and rows: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Decision: continue matching Penpot's viewport row/column drag model, now covering grid items and areas that span multiple tracks.
- Adaptation: Layo uses rectangular grid placement only, so a moved spanned track set is represented by the smallest contiguous bounding span after the reorder.
- Maturity gate: layout maturity in `docs/product/penpot-maturity-benchmark.md`.

## Files

- Modify: `apps/web/src/editor-state.ts`
  - Replace span/area reorder guards with `moveGridPlacementAlongAxis`.
  - Remap explicit `grid_column/grid_row` spans by bounding the moved track index set.
  - Remap named `grid_areas` spans the same way.
  - Preserve child `grid_area` bindings during normal reorder.
- Modify: `apps/web/src/editor-state.test.ts`
  - Add unit regressions for spanned item reorder and named area reorder.
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
  - Add Playwright CLI coverage for dragging a column header when a selected child spans multiple columns.
- Modify: `docs/product/penpot-maturity-benchmark.md`
  - Move basic spanned-item and named-area viewport reorder into the current layout posture.
- Modify: `docs/product/figma-migration-roadmap.md`
  - Record bounded span/area reorder and keep richer viewport area editing as a remaining gap.
- Modify: `docs/superpowers/PLAN_STATUS.md`
  - Add this plan to completed plans after verification.

## Tasks

### Task 1: RED Unit And Playwright Coverage

- [x] **Step 1: Write failing unit tests**

Add tests to `apps/web/src/editor-state.test.ts`:

- `reorders a spanned grid column item by bounding moved tracks`
- `reorders a named grid area span while preserving the child area assignment`

- [x] **Step 2: Verify unit RED**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "spanned grid column|named grid area span"
```

Expected RED: current `reorder_grid_track_with_children` returns no-op when a placement or area span on the moved axis is greater than one.

- [x] **Step 3: Write failing Playwright coverage**

Add `canvas grid header reorder supports spanned grid items` to `apps/web/e2e/editor-mvp.spec.ts`.

- [x] **Step 4: Verify Playwright RED**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header reorder supports spanned grid items" --workers=1 --reporter=line
```

Expected RED: dragging a header does not reorder tracks while the selected child has a column span greater than one.

### Task 2: Implement Span And Area Remapping

- [x] **Step 1: Add placement remapping helper**

Add `moveGridPlacementAlongAxis(placement, axis, fromIndex, toIndex)` that maps every covered track index through `moveTrackIndex`, then returns `{ start: min, span: max - min + 1 }` on the moved axis.

- [x] **Step 2: Use remapped placement for explicit children**

In normal reorder mode, replace direct `moveTrackIndex(placement.column|row)` handling with the placement helper. For children with `layout_item.grid_area`, keep `grid_area` and let the moved area definition drive layout.

- [x] **Step 3: Use remapped placement for named areas**

Update `moveGridAreas` to remap area spans with the same helper instead of blocking span greater than one.

- [x] **Step 4: Verify unit GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "spanned grid column|named grid area span"
```

Expected GREEN: track values reorder, spanned explicit children get bounded spans, named areas move, and named-area children keep `grid_area`.

### Task 3: Focused Browser Verification

- [x] **Step 1: Verify focused Playwright GREEN**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header reorder supports spanned grid items" --workers=1 --reporter=line
```

Expected GREEN: dragging the first column header to the third position reorders track values and expands the spanned child to the bounded span in the Inspector.

- [x] **Step 2: Capture Playwright API-log proof**

Run:

```bash
DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header reorder supports spanned grid items" --workers=1 --reporter=line
```

Expected GREEN: API log shows the header drag and Inspector assertions.

### Task 4: Documentation And Full Verification

- [x] **Step 1: Update maturity docs**

Update `docs/product/penpot-maturity-benchmark.md`, `docs/product/figma-migration-roadmap.md`, and `docs/superpowers/PLAN_STATUS.md`.

- [x] **Step 2: Run verification**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "spanned grid column|named grid area span"
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header reorder supports spanned grid items" --workers=1 --reporter=line
DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header reorder supports spanned grid items" --workers=1 --reporter=line
pnpm --filter @layo/web typecheck
pnpm typecheck
pnpm run check:penpot-maturity
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
git diff --check
```

Expected GREEN: all commands exit 0. Any failure becomes the next loop goal.

## Remaining Gaps After This Slice

- Viewport area/span editing by directly dragging area boundaries.
- Baseline alignment and deeper grid resizing semantics.
