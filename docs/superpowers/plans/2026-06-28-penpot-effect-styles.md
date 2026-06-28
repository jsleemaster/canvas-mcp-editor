# Penpot Effect Styles

## Goal

Close the reusable effect-style gap after shadow-token fidelity by making a
single CSS `box-shadow` effect reusable as a document-local style that can be
created, applied, inspected, validated, persisted, undone, exported, and driven
through agent/MCP surfaces.

## Penpot Reference

- Penpot reusable design assets include styles and shared design-system assets:
  https://help.penpot.app/user-guide/design-systems/assets/
- Penpot design tokens cover shadow values, but reusable styles are still a
  separate product expectation for design-system reuse:
  https://help.penpot.app/user-guide/design-systems/design-tokens/

Layo adapts this to the existing single CSS `box-shadow` effect model. This
slice does not attempt full multi-effect stacks, blur-only effects, or hosted
library registry sync.

## Minimal-Change Ladder

- Reused the existing document-local `DesignStyle` model, style management UI,
  agent command batch path, style usage summaries, manual override cleanup,
  undo/redo state snapshots, Rust serde model, and code export annotations.
- Added only the missing `effect` style type, `style.effect_shadow_style`, a
  `set_effect_shadow_style` command, right Inspector effect-style controls, and
  effect-style export metadata.

## RED Evidence

These tests were added before production code and failed for the expected
missing-behavior reasons:

```bash
pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect style"
pnpm --filter @layo/server test -- src/storage.test.ts -t "effect styles"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect styles"
cargo test -p editor-core effect_style_binding_round_trips_through_json
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "reusable effect styles" --workers=1 --reporter=line
```

Failures proved that effect styles were rejected by validation, code export had
no `effectShadowStyle` metadata, web editor state had no undoable
`set_effect_shadow_style` command, Rust did not round-trip the binding, and the
right Inspector had no effect-style create/apply UI.

## GREEN Evidence

```bash
pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect style"
pnpm --filter @layo/server test -- src/storage.test.ts -t "effect styles"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect styles"
cargo test -p editor-core effect_style_binding_round_trips_through_json
cargo test -p editor-core export_bindings -- --nocapture
pnpm --filter @layo/web typecheck
pnpm --filter @layo/server typecheck
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "reusable effect styles" --workers=1 --reporter=line
```

The Playwright CLI e2e creates a project, selects the headline, enters a
box-shadow in the right Inspector, saves it as `Effects / Card Raised`, verifies
the effect-style select and readout, polls saved file JSON for the style and
node binding, reloads, and confirms the effect-style select persists.

## Full Verification

Passed before PR merge on 2026-06-28:

```bash
pnpm run check:design-rules
pnpm run check:penpot-maturity
pnpm typecheck
pnpm --filter @layo/web build
cargo test -p editor-core
pnpm test
pnpm test:e2e
git diff --check
```

The full Playwright CLI suite passed with 138 tests, including the new right
Inspector reusable effect-style creation and persistence flow.

## Remaining Gaps

- Multiple effects per node, inset shadows, blur-only effects, and richer
  effect-stack editing are still not modeled.
- Raster/PDF/SVG artifact rendering still does not cover all effect fidelity.
- Hosted shared design-system registry and synchronized style updates remain
  later design-system maturity work.
