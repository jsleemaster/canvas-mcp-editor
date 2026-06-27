# Penpot Variant Fill Override Preservation

**Goal:** Preserve compatible component-instance fill overrides while switching variants, extending the existing text override preservation path toward Penpot-grade variant behavior.

**Architecture:** Keep the existing generic component override record shape. Add fill override sync at the mutation boundary (`set_fill` and `setNodeFill`) by comparing the edited instance node against the active variant source node. Extend instance materialization to reapply both text and fill overrides after cloning the selected variant source tree.

## Files

- Modify `apps/web/src/editor-state.ts` to sync and apply `field: "fill"` overrides.
- Modify `apps/server/src/storage.ts` to mirror web fill override sync and apply behavior.
- Modify `apps/web/src/editor-state.test.ts` for reducer RED/GREEN coverage.
- Modify `apps/server/src/storage.test.ts` for persisted storage RED/GREEN coverage.
- Update `docs/product/penpot-maturity-benchmark.md` and `docs/superpowers/PLAN_STATUS.md`.

## TDD Steps

- [x] Add web reducer RED test for nested fill override preservation across variant source-tree switching.
- [x] Add server storage RED test for persisted fill override preservation across variant source-tree switching.
- [x] Confirm both focused tests fail because the switched tree uses the target variant source fill.
- [x] Record fill overrides from manual fill updates.
- [x] Reapply compatible fill overrides during component instance materialization.
- [x] Confirm focused tests turn GREEN.
- [x] Run full maturity/design/type/test/build/e2e gates.
- [x] Prepare for REST PR, merge, and post-merge cleanup.

## Commands

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "fill overrides"
pnpm --filter @layo/server test -- src/storage.test.ts -t "fill overrides"
pnpm typecheck
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
git diff --check
```

## Evidence

- RED web: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "fill overrides"` failed because the switched instance text node fill was `#475569` from the secondary variant source instead of the manual `#f97316`.
- RED server: `pnpm --filter @layo/server test -- src/storage.test.ts -t "fill overrides"` failed because persisted switched instance text node fill was `#475569` instead of the manual `#f97316`.
- GREEN focused: `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "fill overrides"` passed with 158 tests in the filtered run.
- GREEN focused: `pnpm --filter @layo/server test -- src/storage.test.ts -t "fill overrides"` passed with 128 tests in the filtered run.
- GREEN typecheck: `pnpm typecheck` passed.
- Gates: `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, `pnpm --filter @layo/web build`, `pnpm test`, `pnpm test:e2e` with 133 passing tests, and `git diff --check` passed.
