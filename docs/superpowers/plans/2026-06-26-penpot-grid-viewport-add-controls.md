# Penpot Grid Viewport Add Controls

**Goal:** Move Layo's grid editing closer to Penpot by adding selected-grid
viewport controls that append rows and columns directly from the canvas.

**Penpot reference:** Penpot Flexible Layouts, Grid Layout > Edit rows and
columns: https://help.penpot.app/user-guide/designing/flexible-layouts/

**Decision:** Adopt the visible `+` add-row/add-column affordance, adapted to
Layo's current grid model by appending a `1fr` track through the existing
`set_node_layout` command path. Defer row/column deletion, reorder, header
context menus, and viewport area/span editing to later maturity slices.

**Maturity gate:** Layout maturity in
`docs/product/penpot-maturity-benchmark.md`.

## Gap

Layo already renders selected-grid viewport lines and resize handles, but did
not expose Penpot-like `+` controls at the row/column header ends. Users had to
edit track counts or track strings through the Inspector rather than adding a
row or column directly on the canvas.

## Minimal-Change Ladder

- Reuse the existing grid viewport overlay instead of adding a second canvas
  editor layer.
- Reuse `set_node_layout`, normalized layout metadata, and existing grid track
  parsing/serialization.
- Materialize the appended row or column as a `1fr` track so Inspector values,
  persistence, undo/redo, and layout solving all follow current behavior.
- Keep this slice to append controls only. Do not implement delete, reorder,
  row/column contextual menus, or area editing in this PR.

## Tests

- RED: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid viewport add controls append rows and columns" --workers=1 --reporter=line`
  failed because `grid-column-add-control` was not found.
- GREEN: the same Playwright CLI test passes after adding the viewport controls.

## Verification Checklist

- [x] Focused Playwright CLI test proves row/column add controls are visible.
- [x] Focused Playwright CLI test proves adding a column appends `1fr` and
  places the next child into the new column.
- [x] Focused Playwright CLI test proves adding a row appends `1fr` and places
  the next child into the new row.
- [x] `pnpm --filter @layo/web typecheck`
- [x] `pnpm run check:penpot-maturity`
- [x] `pnpm --filter @layo/web build`
- [x] `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid viewport add controls append rows and columns" --workers=1 --reporter=line`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] `git diff --check`

## Remaining Gaps

- Viewport row/column delete controls.
- Viewport row/column reorder and header context menus.
- Viewport area/span editing.
- Deeper grid resizing semantics beyond appended `1fr` tracks and existing
  dragged `px` track resizing.
