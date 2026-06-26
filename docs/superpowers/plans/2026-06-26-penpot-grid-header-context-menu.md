# Penpot Grid Header Context Menu

**Goal:** Move Layo's grid editing closer to Penpot by adding selected-grid
row and column header menus for direct track insert, duplicate, and delete
actions from the canvas.

**Penpot reference:** Penpot Flexible Layouts, Grid Layout > Edit rows and
columns: https://help.penpot.app/user-guide/designing/flexible-layouts/

**Decision:** Adopt the row/column header context-menu affordance, adapted to
Layo's current grid model. Header menu actions update `grid_column_tracks` or
`grid_row_tracks` through the existing `set_node_layout` path, preserving
Inspector values, relayout, undo/redo, persistence, and collaboration command
semantics. Defer row/column reorder, delete-with-shapes variants, and viewport
area/span editing to later maturity slices.

**Maturity gate:** Layout maturity in
`docs/product/penpot-maturity-benchmark.md`.

## Gap

Layo already supports selected-grid viewport track resizing, appending rows or
columns, and deleting specific tracks with direct `+` / `-` controls. It did
not expose a Penpot-like row/column header menu for inserting before/after,
duplicating, or deleting the selected track from the canvas.

## Minimal-Change Ladder

- Reuse the existing grid viewport overlay instead of adding a separate grid
  edit mode.
- Reuse the existing object context-menu rendering primitives for menu
  sections and items.
- Reuse `set_node_layout`, normalized layout metadata, and existing grid track
  parsing/serialization.
- Keep this slice to row/column header menu insert, duplicate, and delete
  actions. Do not implement reorder, area/span editing, or delete-with-shapes
  behavior in this PR.

## Tests

- RED: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header context menu edits rows and columns" --workers=1 --reporter=line`
  failed because `grid-column-header-2` was not found.
- GREEN: the same Playwright CLI test passes after adding header controls and
  row/column context-menu actions.

## Verification Checklist

- [x] Focused Playwright CLI test proves column header context menus open.
- [x] Focused Playwright CLI test proves inserting a column before the selected
  header materializes a `1fr` track at the correct index.
- [x] Focused Playwright CLI test proves duplicating a column copies the
  selected track.
- [x] Focused Playwright CLI test proves deleting a column removes the selected
  track.
- [x] Focused Playwright CLI test proves row header duplicate and delete actions
  update `grid_row_tracks`.
- [x] `pnpm --filter @layo/web typecheck`
- [x] `pnpm typecheck`
- [x] `pnpm run check:penpot-maturity`
- [x] `pnpm --filter @layo/web build`
- [x] `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "canvas grid header context menu edits rows and columns" --workers=1 --reporter=line`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] `git diff --check`

## Remaining Gaps

- Viewport row/column reorder controls.
- Delete-row/delete-column-and-shapes variants.
- Viewport area/span editing.
- Deeper grid resizing semantics beyond appended `1fr` tracks, dragged `px`
  track resizing, direct track removal, and header menu insert/duplicate/delete.
