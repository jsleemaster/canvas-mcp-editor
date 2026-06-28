# Penpot Multi-Effect Stack

## Goal

Close the next design-system and developer-handoff fidelity gap after reusable
effect styles by making ordered multi-shadow effect stacks part of Layo's saved
style model, human Inspector UI, agent/MCP command surface, Rust document
contract, and CSS/structure export output.

## Penpot Reference

- Penpot reusable design assets include reusable styles and shared
  design-system assets:
  https://help.penpot.app/user-guide/design-systems/assets/
- Penpot design tokens include shadow tokens and shadow properties in the
  Design tab:
  https://help.penpot.app/user-guide/design-systems/design-tokens/

Layo adapts this as an ordered stack of safe CSS `box-shadow` layer strings.
That keeps the current renderer/export path deterministic while moving the
document model beyond a single-shadow-only effect. This slice deliberately does
not attempt blur-only effects, arbitrary filter graphs, or hosted registry sync.

## Minimal-Change Ladder

- Reused the existing single-shadow `effect_shadow` materialized string,
  `effect_shadow_token` and `effect_shadow_style` binding behavior, safe shadow
  validation, command batch validation, undo/redo snapshots, right Inspector
  effect controls, Rust serde model, and code-export annotations.
- Added only the missing ordered `style.effect_shadows` stack, a
  `set_effect_shadows` command, a compact Inspector multiline stack editor, and
  structure/export metadata that preserves the individual layers.

## RED Evidence

These tests were added before production code and failed for the expected
missing-behavior reasons:

```bash
pnpm --filter @layo/server test -- src/code-export.test.ts -t "multi effect shadow stacks"
pnpm --filter @layo/server test -- src/storage.test.ts -t "multi effect shadow stacks"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "multi effect shadow stacks"
cargo test -p editor-core multi_effect_shadow_stack_round_trips_through_json
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "multi-effect shadow stacks" --workers=1 --reporter=line
```

Failures proved that code export had no stacked `box-shadow`, server command
batches did not understand `set_effect_shadows`, web editor state had no
undoable command, Rust did not round-trip the stack, and the right Inspector had
no stack editor.

## GREEN Evidence

```bash
pnpm --filter @layo/server test -- src/code-export.test.ts -t "multi effect shadow stacks"
pnpm --filter @layo/server test -- src/storage.test.ts -t "multi effect shadow stacks"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "multi effect shadow stacks"
cargo test -p editor-core multi_effect_shadow_stack_round_trips_through_json
cargo test -p editor-core export_bindings -- --nocapture
pnpm --filter @layo/web typecheck
pnpm --filter @layo/server typecheck
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "multi-effect shadow stacks" --workers=1 --reporter=line
```

The Playwright CLI e2e creates a project, selects the headline, edits two
shadow layers in the right Inspector stack editor, verifies the persisted JSON
contains both `effect_shadow` and `effect_shadows`, reloads, and confirms the
stack editor still shows both layers.

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

The full Playwright CLI suite passed with 139 tests, including the new right
Inspector multi-effect shadow stack persistence flow.

## Remaining Gaps

- Inset shadows, blur-only effects, and non-shadow filter/effect graphs are
  still not modeled.
- Raster/PDF/SVG artifact rendering still does not cover all stacked-effect
  fidelity.
- Hosted shared design-system registry and synchronized effect-style updates
  remain later design-system maturity work.
