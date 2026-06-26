# Penpot Grid Ctrl Preserve Reorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like Ctrl/Command grid row and column header drag reordering that moves the grid track order while preserving static grid-flow objects in their current visual positions.

**Architecture:** Extend the existing `reorder_grid_track_with_children` command with an optional preserve-elements mode. Normal drag keeps moving static grid-flow children with their tracks; Ctrl/Command drag reorders tracks and materializes explicit grid placement plus margins so affected static children remain static grid items at their previous x/y. Undo restores the previous frame snapshot.

**Tech Stack:** React, TypeScript, Vitest, Playwright CLI, Layo renderer document model.

---

## Penpot Reference

- Source: Penpot Flexible Layouts, Grid Layout > Design viewport > Drag columns and rows: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Decision: adopt the Penpot Ctrl row/column drag variation that leaves elements in place while moving the row/column track.
- Adaptation: support the same behavior from Layo's selected-grid viewport headers using `Ctrl` or `Command` during drag. Static grid-flow children remain static by remapping their grid placement and margins instead of converting them to absolute children.
- Maturity gate: layout maturity in `docs/product/penpot-maturity-benchmark.md`.

## Files

- Modify: `apps/web/src/editor-state.ts`
  - Add `preserveChildren?: boolean` to `reorder_grid_track_with_children`.
  - Preserve child x/y through explicit grid placement and margins when the modifier flag is set.
  - Keep the existing previous-frame snapshot undo path.
- Modify: `apps/web/src/App.tsx`
  - Capture `event.ctrlKey || event.metaKey` when starting a grid header drag.
  - Dispatch `preserveChildren: true` on drop.
- Modify: `apps/web/src/editor-state.test.ts`
  - Add unit regressions for Ctrl column and row reorder preserving visual positions.
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
  - Add Playwright CLI coverage for Ctrl/Command header drag preserving layer positions while track values reorder.
- Modify: `docs/product/penpot-maturity-benchmark.md`
  - Move the basic Penpot leave-elements-in-place reorder variation into the current layout posture.
- Modify: `docs/product/figma-migration-roadmap.md`
  - Record Ctrl/Command grid reorder preserve-elements support and keep area/span-aware viewport reorder as a remaining gap.
- Modify: `docs/superpowers/PLAN_STATUS.md`
  - Add this plan to completed plans after verification.

## Tasks

### Task 1: RED Unit And Playwright Coverage

- [x] **Step 1: Write failing unit tests**

Add these tests to `apps/web/src/editor-state.test.ts`:

- `reorders a grid column while preserving child positions when requested`
- `reorders a grid row while preserving child positions when requested`

- [x] **Step 2: Verify unit RED**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "preserving child positions"
```

Expected RED: the command ignores `preserveChildren`, so children move with the reordered track instead of staying at their previous x/y.

- [x] **Step 3: Write failing Playwright coverage**

Add `canvas grid Ctrl-drag reorder preserves object positions` to `apps/web/e2e/editor-mvp.spec.ts`.

- [x] **Step 4: Verify Playwright RED**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid Ctrl-drag reorder preserves object positions" --workers=1 --reporter=line
```

Expected RED: Ctrl/Command state is not carried from header `mousedown` to drop dispatch, so objects still move with tracks.

### Task 2: Implement Preserve-Elements Reorder

- [x] **Step 1: Add command metadata**

Extend `reorder_grid_track_with_children` with `preserveChildren?: boolean`.

- [x] **Step 2: Preserve child positions in editor state**

When `preserveChildren` is true, snapshot each static flow child's current transform and size, reorder the tracks, remap each child to a grid cell whose start is at or before the previous x/y, and materialize margins to keep the child at the previous x/y after relayout. Do not convert children to absolute positioning.

- [x] **Step 3: Verify unit GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "preserving child positions"
```

Expected GREEN: track values reorder while child x/y positions remain unchanged and undo restores the previous frame snapshot.

### Task 3: Wire Ctrl/Command Header Drag

- [x] **Step 1: Add modifier state to header drag**

Store `preserveChildren: event.ctrlKey || event.metaKey` in `GridTrackDragState`.

- [x] **Step 2: Dispatch modifier command**

Pass `preserveChildren: session.preserveChildren` into `reorder_grid_track_with_children` when dropping on a same-node, same-axis header.

- [x] **Step 3: Verify focused Playwright GREEN**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid Ctrl-drag reorder preserves object positions" --workers=1 --reporter=line
```

Expected GREEN: holding Control while dragging a grid header reorders Inspector track values and leaves the selected layers at their original Inspector x/y.

### Task 4: Documentation And Full Verification

- [x] **Step 1: Update maturity docs**

Update `docs/product/penpot-maturity-benchmark.md`, `docs/product/figma-migration-roadmap.md`, and `docs/superpowers/PLAN_STATUS.md`.

- [x] **Step 2: Run verification**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "preserving child positions"
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid Ctrl-drag reorder preserves object positions" --workers=1 --reporter=line
DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid Ctrl-drag reorder preserves object positions" --workers=1 --reporter=line
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

- Area/span-aware viewport grid reorder semantics.
- Viewport area/span editing.
- Baseline alignment and deeper grid resizing semantics.
