# Penpot Grid Viewport Remove Controls

**Goal:** Move Layo's grid editing closer to Penpot by adding selected-grid
viewport controls that delete specific rows and columns directly from the
canvas.

**Penpot reference:** Penpot Flexible Layouts, Grid Layout > Edit rows and
columns: https://help.penpot.app/user-guide/designing/flexible-layouts/

**Decision:** Adopt the row/column delete affordance, adapted to Layo's current
grid model by rendering per-track `-` controls in the selected-grid viewport.
Deleting a row or column filters that track and persists the result through the
existing `set_node_layout` command path. Defer row/column reorder, header
context menus, delete-with-shapes variants, and viewport area/span editing to
later maturity slices.

**Maturity gate:** Layout maturity in
`docs/product/penpot-maturity-benchmark.md`.

## Gap

Layo already supports selected-grid viewport track resizing and appending rows
or columns with `+` controls. It did not expose a Penpot-like direct way to
remove a specific row or column from the canvas, so users had to edit track
strings manually in the Inspector.

## Minimal-Change Ladder

- Reuse the existing grid viewport overlay instead of adding a separate grid
  edit mode.
- Reuse `set_node_layout`, normalized layout metadata, and existing grid track
  parsing/serialization.
- Keep delete behavior scoped to track removal; the existing layout solver
  handles child reflow and manual placement clamping.
- Keep this slice to direct delete controls only. Do not implement reorder,
  row/column contextual menus, or delete-with-shapes behavior in this PR.

## Tests

- RED: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid viewport remove controls delete specific rows and columns" --workers=1 --reporter=line`
  failed because `grid-column-remove-control-3` was not found.
- GREEN: the same Playwright CLI test passes after adding the viewport remove
  controls.

## Verification Checklist

- [x] Focused Playwright CLI test proves row/column remove controls are visible.
- [x] Focused Playwright CLI test proves deleting a column filters the selected
  column track and removes that control from the viewport.
- [x] Focused Playwright CLI test proves deleting a row filters the selected row
  track and removes that control from the viewport.
- [x] Focused Playwright CLI test proves new children reflow into the remaining
  two-column/two-row grid.
- [x] `pnpm --filter @layo/web typecheck`
- [x] `pnpm run check:penpot-maturity`
- [x] `pnpm --filter @layo/web build`
- [x] `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid viewport remove controls delete specific rows and columns" --workers=1 --reporter=line`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] `git diff --check`

## Remaining Gaps

- Viewport row/column reorder controls.
- Viewport row/column header context menus.
- Delete-row/delete-column-and-shapes variants.
- Viewport area/span editing.
- Deeper grid resizing semantics beyond appended `1fr` tracks, dragged `px`
  track resizing, and direct track removal.
