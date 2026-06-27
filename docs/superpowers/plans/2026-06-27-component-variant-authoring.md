# Component Variant Authoring

**Goal:** Add Penpot-like component variant authoring to the right Inspector so Layo users can create and edit variant properties on a selected main component, not only select variants on instances.

**Penpot reference:** Penpot component variants treat variant properties as first-class component data editable from the Design tab, and instances expose those properties as controls. Layo already stores component variants and lets selected instances choose variant values, but the editor has no visible authoring surface for the component definition itself.

**Adopt/adapt/diverge:**
- Adopt: selected main components expose variant controls in the right Inspector.
- Adapt: start with deterministic property/value rows for component definitions, backed by the existing `ComponentDefinition.variants[]` model.
- Defer: multi-property combination matrices, boolean/text instance properties, nested swaps, and hosted library sync.

**Maturity gate:** Design systems, gate 3 in `docs/product/penpot-maturity-benchmark.md`.

## Plan

1. Add RED editor-state coverage for a `set_component_variants` command:
   - updates a component definition's variants,
   - resets existing instances whose selected `variant_id` no longer exists,
   - supports undo/redo.
2. Add RED Playwright CLI coverage for the UI:
   - create a component,
   - select its main component layer,
   - add a variant property/value in the right Inspector,
   - reload and verify an instance exposes the authored property control.
3. Implement the undoable web command and wire it through collaboration/local dispatch.
4. Add a `PUT /files/:fileId/components/:componentId/variants` web persistence helper.
5. Add Inspector UI for selected main component definitions:
   - section `data-testid="inspector-component-definition-variants"`,
   - add button `data-testid="inspector-component-variant-add"`,
   - editable property/value/name fields per variant.
6. Update maturity docs and status with the closed authoring slice and remaining combination-management gaps.
7. Verify with focused web tests, Playwright CLI, build/typecheck, full gates, PR/merge, and worktree cleanup.

## RED Evidence

- `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "sets component definition variants"` failed because `set_component_variants` was not handled by editor state.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "right inspector authors component variants" --workers=1 --reporter=line` failed because `inspector-component-definition-variants` was missing for selected main components.

## GREEN Evidence

- Focused state GREEN: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "sets component definition variants"` passed.
- Focused Playwright CLI GREEN: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "right inspector authors component variants" --workers=1 --reporter=line` passed.
- Focused web state suite: `pnpm --filter @layo/web test -- src/editor-state.test.ts` passed.
- Maturity/design/build gates: `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, and `pnpm --filter @layo/web build` passed.
- Full gate: `pnpm test` passed.
- Full Playwright CLI: `pnpm test:e2e` passed with 118 tests.
- Full typecheck and whitespace: `pnpm typecheck` and `git diff --check` passed.
- Collaboration Playwright CLI: `pnpm test:e2e:collab` first failed because no relay was listening on `ws://127.0.0.1:4327`; after starting `pnpm --filter @layo/collab-relay dev`, `pnpm test:e2e:collab` passed with 5 tests.
