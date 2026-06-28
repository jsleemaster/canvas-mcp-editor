# Penpot Effect Artifact Fidelity

## Goal

Close the next developer-handoff gap after multi-effect shadow stacks by making
selected-layer SVG and PDF artifacts preserve saved effect shadows instead of
only exposing them in CSS/structure metadata.

## Penpot Reference

- Penpot layer export includes image, SVG, and PDF formats for selected assets:
  https://help.penpot.app/user-guide/export-import/export-import-files/
- Penpot design-system assets and tokens set the expectation that reusable
  visual styling survives handoff, not only in the canvas:
  https://help.penpot.app/user-guide/design-systems/assets/
  https://help.penpot.app/user-guide/design-systems/design-tokens/

Layo adapts this by preserving its existing safe CSS-like shadow stack in
vector artifacts. SVG gets deterministic `<filter><feDropShadow>` definitions;
PDF gets transparent shadow drawing commands through `/ExtGState`. This does
not claim full filter graph fidelity, blur-only effects, or raster export parity.

## Minimal-Change Ladder

- Reused the existing `style.effect_shadow` and `style.effect_shadows` model,
  the Dev Panel SVG/PDF download paths, the tested `node-artifacts` helper, and
  the current Playwright CLI download assertions.
- Added only a local artifact parser/renderer for safe shadow layers, expanded
  export bounds to avoid clipping shadows, and extended the existing PDF writer
  with transparent shadow commands.

## RED Evidence

These tests were added before production code and failed for the expected
missing-behavior reasons:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts -t "effect shadow stacks"
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "selected effect shadows in vector artifacts" --workers=1 --reporter=line
```

Failures proved that selected-layer SVG artifacts had no shadow filter, kept the
old unexpanded viewBox, and selected-layer PDF artifacts had no expanded media
box or transparent shadow drawing resources.

During implementation review, a nested-frame regression test was added and
failed before the final fix:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts -t "child effect shadow filters"
```

The failure proved that child-layer SVG shadows produced nested `<defs>` blocks
instead of one valid root defs block.

## GREEN Evidence

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts -t "effect shadow stacks"
node scripts/run-e2e.mjs apps/web/e2e/editor-mvp.spec.ts -g "selected effect shadows in vector artifacts" --workers=1 --reporter=line
```

The Playwright CLI e2e creates a project, edits a two-layer effect shadow stack
in the right Inspector, opens the Dev tab, downloads SVG and PDF artifacts, and
inspects the downloaded files for the SVG filter colors/opacities and PDF
`/ExtGState` opacity resources.

The focused child-shadow unit test now passes after flattening SVG filter
collection into a single root `<defs>` block:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts -t "child effect shadow filters"
pnpm --filter @layo/web test -- src/node-artifacts.test.ts
```

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

The full Playwright CLI suite passed with 140 tests, including the new selected
effect-shadow vector artifact download flow.

## Remaining Gaps

- Raster PNG/JPEG/WEBP export still depends on the browser/Konva raster path and
  needs explicit stacked-effect artifact assertions.
- Inset shadows, blur-only effects, and non-shadow filter/effect graphs are
  still not modeled.
- Hosted shared design-system registry and synchronized effect-style updates
  remain later design-system maturity work.
