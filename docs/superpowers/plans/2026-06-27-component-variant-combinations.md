# Component Variant Combinations

**Goal:** Move Layo's component variant authoring closer to Penpot by letting selected main components manage multiple variant property rows, then prove selected instances can switch by those property combinations.

**Penpot reference:** Penpot variants use properties and values as combination dimensions. Creating a property adds a row across the component variant set, and instances expose property controls that select the matching variant combination.

**Adopt/adapt/diverge:**
- Adopt: multiple property/value rows per variant are editable from the right Inspector.
- Adopt: adding a property to one variant gives every variant a matching editable row so combinations stay visible.
- Adapt: use the existing `ComponentDefinition.variants[].properties[]` model and existing instance property selects rather than introducing a separate matrix object.
- Defer: property reordering, boolean/text component properties, instance swaps, and richer visual component-set canvas layout.

**Maturity gate:** Design systems, gate 3 in `docs/product/penpot-maturity-benchmark.md`.

## Plan

1. Add RED Playwright CLI coverage for selected-main-component multi-property authoring:
   - create a component,
   - edit the default `surface=flat` row,
   - add a `size=regular` property row,
   - add a second variant with `surface=elevated` and `size=large`,
   - reload, create an instance, and verify both `surface` and `size` controls exist and switch to the matching combination.
2. Implement Inspector helpers for arbitrary property rows:
   - add property row across all variants,
   - update a property name across all variants for a given row,
   - update each variant's row value independently,
   - keep at least one property row visible for each variant.
3. Preserve the existing `set_component_variants` command and HTTP persistence path.
4. Update maturity docs/status so the remaining gap narrows from multi-property combination authoring to richer variant matrix management and property types.
5. Verify focused RED/GREEN, full tests, Playwright CLI, PR/merge, and cleanup.

## RED Evidence

- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "multi-property component variant combinations" --workers=1 --reporter=line` failed because the selected-main-component Inspector only exposed the first property row and did not render `inspector-component-definition-variant-property-name-default-0`.

## GREEN Evidence

- Focused GREEN: `pnpm --filter @layo/web typecheck` passed.
- Focused Playwright CLI GREEN: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "right inspector authors component variants on selected main components|multi-property component variant combinations" --workers=1 --reporter=line` passed with 2 tests.
- Full local test GREEN: `pnpm test` passed.
- Full workspace typecheck GREEN: `pnpm typecheck` passed.
- Web production build GREEN: `pnpm --filter @layo/web build` passed.
- Full editor Playwright CLI GREEN: `pnpm test:e2e` passed with 119 tests.
- Direct UI proof GREEN: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "multi-property component variant combinations" --workers=1 --headed --reporter=line` passed, exercising the right Inspector property-row add, variant add, reload, instance select, and combination selection path in a live browser.
- Collaboration Playwright CLI GREEN: `pnpm test:e2e:collab` passed with 5 tests after starting the local TypeScript relay.
