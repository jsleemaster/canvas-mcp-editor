# Penpot Shadow Token Fidelity

## Goal

Close the next design-system fidelity gap after raw `effect_shadow` by making
shadow tokens first-class enough to import, bind, inspect, validate, persist,
and export through Layo's human UI and agent surfaces.

## Penpot Reference

- Penpot design tokens include shadow tokens as composite tokens and allow them
  to be attached to shadow properties in the Design tab:
  https://help.penpot.app/user-guide/design-systems/design-tokens/

Layo adapts this as a product-aligned slice: internally, a shadow token value is
stored as a safe CSS `box-shadow` string so it reuses the existing canvas and
code-export shadow path; DTCG import/export uses the composite object shape.
This is not yet a complete multi-effect stack, inset/blur effects, or hosted
effect-style registry.

## Minimal-Change Ladder

- Reused existing `DesignToken` document storage, active token-set/theme
  resolution, agent command batches, DTCG token import/export, right Inspector
  token controls, undoable editor-state commands, and code-export CSS variable
  helpers.
- New code was unavoidable only for the missing `shadow` token type,
  `style.effect_shadow_token`, DTCG shadow composite conversion, and the right
  Inspector token select.

## RED Evidence

These tests were added before production code and failed for the expected
missing-behavior reasons:

```bash
pnpm --filter @layo/server test -- src/design-token-io.test.ts -t "shadow composite"
pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect shadow token"
pnpm --filter @layo/server test -- src/storage.test.ts -t "shadow tokens"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect shadow token"
cargo test -p editor-core shadow_token_binding_round_trips_through_json
```

Failures proved that shadow tokens were dropped during DTCG import, code export
had no shadow token metadata or CSS variable fallback, agent validation did not
accept shadow tokens, web editor state had no undoable `set_effect_shadow_token`
command, and Rust did not round-trip the token binding.

## GREEN Evidence

```bash
pnpm --filter @layo/server test -- src/design-token-io.test.ts -t "shadow composite"
pnpm --filter @layo/server test -- src/code-export.test.ts -t "effect shadow token"
pnpm --filter @layo/server test -- src/storage.test.ts -t "shadow tokens"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "effect shadow token"
cargo test -p editor-core shadow_token_binding_round_trips_through_json
pnpm --filter @layo/web typecheck
pnpm --filter @layo/server typecheck
pnpm run check:penpot-maturity
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "shadow tokens" --workers=1 --reporter=line
```

The Playwright CLI e2e imported a DTCG shadow token, selected the headline,
used the right Inspector shadow token select, verified the materialized
`effect_shadow`, polled saved file JSON for `effect_shadow_token`, reloaded, and
confirmed the Inspector select still showed the bound token.

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

The full Playwright CLI suite passed with 137 tests, including the new right
Inspector shadow-token binding persistence flow.

## Remaining Gaps

- Multiple effects per node, inset shadows, blur-only effects, and reusable
  effect styles are still not modeled.
- Raster/PDF/SVG artifact rendering still does not cover all shadow/effect
  fidelity.
- Hosted shared design-system registry and synchronized effect-style updates
  remain later design-system maturity work.
