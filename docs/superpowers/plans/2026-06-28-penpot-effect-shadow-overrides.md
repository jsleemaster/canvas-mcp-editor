# Penpot Effect Shadow Overrides

## Goal

Close the first effect/style override fidelity gap from the Penpot maturity
benchmark by making a single CSS `box-shadow` effect a first-class Layo style
field that survives component-instance variant source switches and reaches
developer handoff.

## Penpot Reference

- Penpot design systems cover reusable assets, tokens, components, and variants:
  https://help.penpot.app/user-guide/design-systems/assets/
- Penpot design tokens establish the product expectation that style metadata is
  portable across design systems:
  https://help.penpot.app/user-guide/design-systems/design-tokens/
- Penpot variants establish the expectation that component-instance edits stay
  meaningful while switching variants:
  https://help.penpot.app/user-guide/design-systems/variants/

Layo adapts this as a scoped first effect slice: one optional CSS
`style.effect_shadow` string, not a complete multi-effect stack or hosted effect
style registry.

## Implementation

- Added `style.effect_shadow?: string | null` to renderer, server, MCP, agent,
  web state, and Rust document contracts.
- Added component-instance style override tracking for `effect_shadow`, including
  the explicit null value used when an instance clears a source shadow.
- Added right Inspector editing through `data-testid="inspector-effect-shadow"`,
  persisted by the existing agent `set_node_style` command route.
- Added conservative canvas rendering for CSS-like shadow strings that match
  offset-x, offset-y, blur, and a trailing color.
- Added code export support for CSS `box-shadow`, structure `effectShadow`, and
  ready-for-dev style annotation text.

## RED Evidence

- `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect shadow"`
  failed because switching an instance variant restored the variant default
  shadow instead of the instance override.
- `pnpm --filter @layo/server test -- src/storage.test.ts -t "effect shadow"`
  failed because agent command persistence did not preserve the instance shadow
  override across variant switching.
- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect shadows"`
  failed because exported CSS did not include `box-shadow`.
- `cargo test -p editor-core effect_shadow_metadata_round_trips_through_json`
  failed because Rust model serialization did not include `effect_shadow`.
- `node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "effect shadow overrides" --workers=1 --reporter=line`
  failed before the right Inspector exposed `inspector-effect-shadow`.

## GREEN Evidence

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect shadow"
pnpm --filter @layo/server test -- src/storage.test.ts -t "effect shadow"
pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect shadows"
cargo test -p editor-core effect_shadow_metadata_round_trips_through_json
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "effect shadow overrides" --workers=1 --reporter=line
```

All focused checks passed on 2026-06-28.

## Full Verification

```bash
pnpm --filter @layo/web typecheck
pnpm --filter @layo/server typecheck
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm typecheck
pnpm --filter @layo/web build
cargo test -p editor-core
pnpm test
pnpm test:e2e
pnpm test:e2e:collab
git diff --check
```

`pnpm test:e2e:collab` initially failed because it does not start local
services itself and `http://127.0.0.1:5173/` was not running. After starting
`@layo/server`, `@layo/web`, and `@layo/collab-relay` on ports 4317, 5173, and
4327, the same Playwright CLI collaboration suite passed with 5 tests.

## Remaining Gaps

- Multiple effects per node, inset shadows, blur-only effects, and reusable
  effect-style tokens are still not modeled.
- Raster/PDF/SVG artifact output still does not render all effect metadata.
- Hosted shared design-system registry and synchronized effect styles remain
  future design-system maturity work.
