# Penpot Variant Source Viewport Reorder

## Goal

Close the remaining direct-manipulation gap for component variant areas by
letting designers reorder variant sources from the canvas, while preserving
Layo's saved `ComponentDefinition.variants` order and existing HTTP persistence
path.

## Reference

- Penpot components and variants: https://help.penpot.app/user-guide/design-systems/components/#variants
- Penpot variant sets: https://help.penpot.app/user-guide/design-systems/variants/

## Decision

Adopt the design-tool expectation that component variant sources are organized
directly in the visible variant area. Adapt it to Layo by using the existing
variant array order as the source of truth. The viewport handle calls the same
`set_component_variants` reducer and `/components/:componentId/variants`
persistence path as the right Inspector.

## Gap

The previous slice added a visible variant-area outline and direct horizontal
or vertical gap handles, but source ordering still required indirect matrix or
Inspector edits. Reordering source components from the canvas did not exist, so
the variant area still felt read-only for source order.

## Implementation

- Added selected-main-component source reorder handles inside the canvas
  variant-area outline.
- Dragging a source handle projects the dragged source center along the current
  horizontal or vertical area axis and stable-sorts the saved variants.
- Reused `set_component_variants` so undo/redo, source-node reflow, live canvas
  node reflow, instance fallback, and queued HTTP persistence all follow the
  existing component variant path.
- Added storage-side reflow to `setComponentVariants` so server-persisted
  variant order changes keep `component.source_node`, variant `source_node`
  transforms, and live canvas nodes aligned.

## Verification

- RED: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "reflows variant source nodes and canvas nodes when variants are reordered"` failed because `component.source_node` stayed on the old first variant.
- RED: `pnpm --filter @layo/server test -- src/storage.test.ts -t "setComponentVariants reflows persisted variant sources after reorder"` failed because persisted `component.source_node` stayed on the old first variant.
- RED: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "reorders component variant sources directly from the viewport" --workers=1 --reporter=line` failed because `component-variant-source-reorder-handle-variant-button-primary` did not exist.
- GREEN: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "reflows variant source nodes and canvas nodes when variants are reordered"`
- GREEN: `pnpm --filter @layo/server test -- src/storage.test.ts -t "setComponentVariants reflows persisted variant sources after reorder"`
- GREEN: `pnpm --filter @layo/web typecheck`
- GREEN: `pnpm --filter @layo/server typecheck`
- GREEN: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "reorders component variant sources directly from the viewport" --workers=1 --reporter=line`
- GREEN: `pnpm run check:penpot-maturity`
- GREEN: `pnpm run check:design-rules`
- GREEN: `pnpm typecheck`
- GREEN: `pnpm --filter @layo/web build`
- GREEN: `pnpm test`
- GREEN: `pnpm test:e2e` with 135 passing tests.
- GREEN: `git diff --check`

## Remaining Gap

Direct viewport reordering now covers source order for horizontal and vertical
variant areas through the same saved variant order model. Broader effect/style
override fidelity and hosted theme/library registry sync remain open
design-system maturity gaps.
