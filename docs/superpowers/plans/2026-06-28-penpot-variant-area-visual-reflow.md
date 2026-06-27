# Penpot Variant Area Visual Reflow

## Goal

Close the metadata-only variant-area gap by making component variant-area layout
visible and geometry-affecting in the editor canvas, storage, and agent command
paths.

## Reference

- Penpot components and variants: https://help.penpot.app/user-guide/design-systems/components/#variants

## Failure

The previous slice saved `ComponentDefinition.variant_area` and exposed
Inspector/agent controls, but changing the layout only changed metadata. Source
nodes stayed wherever they were on the canvas, so the selected main component
did not behave like a real variant area.

## Implementation

- Added variant-area reflow in the web reducer for:
  - `combine_components_as_variants`, using the default horizontal area.
  - `set_component_variant_area`, preserving a stable area origin while padding
    changes.
- Added matching reflow in server agent commands and `FileStorage`
  `setComponentVariantArea`.
- Updated source node trees and live canvas nodes with matching ids so saved
  component definitions and the visible document stay consistent.
- Added undo restoration for page-node positions when a web combine operation is
  undone.
- Added a selected-main-component canvas outline for the computed variant area.

## Verification

- RED: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "reflows variant source nodes"`
- RED: `pnpm --filter @layo/server test -- src/storage.test.ts -t "component variant area reflows"`
- RED: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "combines selected components as variants" --workers=1 --reporter=line`
- GREEN: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "horizontal variant area layout|reflows variant source nodes"`
- GREEN: `pnpm --filter @layo/server test -- src/storage.test.ts -t "combine component variants reflows|component variant area reflows|setComponentVariantArea reflows"`
- GREEN: `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "combines selected components as variants" --workers=1 --reporter=line`
- GREEN: `pnpm --filter @layo/web typecheck`
- GREEN: `pnpm --filter @layo/server typecheck`

## Remaining Gap

The variant area is now saved, reflowed, and visible. Direct viewport handles
for resizing/reordering the variant area are still not implemented.
