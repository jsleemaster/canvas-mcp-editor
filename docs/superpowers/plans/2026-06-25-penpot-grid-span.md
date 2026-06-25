# Penpot Grid Span Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like multi-cell grid item spans so a grid child can occupy multiple rows/columns, stretch across that spanned area, and reserve the occupied cells for later auto-placed items.

**Architecture:** Extend the existing `NodeLayoutItem` contract with optional 1-based `grid_column_span` and `grid_row_span` fields. Reuse the current grid solver, MCP `set_layout_item`, code export, Rust document model, and Korean Inspector controls; this is the unnamed multi-cell area behavior that Penpot describes before full named grid areas. Named areas, viewport grid editing, non-equal track units, and row/column header tools remain later Penpot-maturity gaps.

**Tech Stack:** React, TypeScript, Vitest, Playwright CLI, Node MCP/server tests, Rust `editor-core`, `ts-rs`.

---

## Penpot Reference

Penpot Grid is CSS Grid-based and supports Auto, Manual, and Area placement. Penpot describes an Area as a composition of any number of grid cells, and Manual/Area cells emit CSS `grid-column` and `grid-row` semantics. Layo already supports auto-placement and manual single-cell row/column placement; this slice adds the missing span portion of that model.

## Files

- Modify: `packages/renderer/src/index.ts` for `NodeLayoutItem.grid_column_span` and `grid_row_span`.
- Modify: `apps/web/src/editor-state.ts` for span normalization and grid placement/reservation.
- Test: `apps/web/src/editor-state.test.ts` for web solver span sizing and auto-cell reservation.
- Modify: `apps/server/src/storage.ts` and `apps/server/src/mcp.ts` for server and MCP command contracts.
- Modify: `apps/server/src/layout.ts` for server grid placement/reservation.
- Test: `apps/server/src/storage.test.ts` for dry-run agent command coverage.
- Test: `apps/server/src/code-export.test.ts` for structured export preservation.
- Modify: `crates/editor-core/src/model.rs` and `crates/editor-core/bindings/NodeLayoutItem.ts` for Rust serialization and generated TypeScript binding.
- Test: `crates/editor-core/tests/document_model.rs` for JSON round-trip coverage.
- Modify: `apps/web/src/App.tsx` for Inspector span controls shown when the selected node's parent uses Grid.
- Test: `apps/web/e2e/editor-mvp.spec.ts` for Playwright CLI Inspector span behavior.
- Modify: `docs/product/penpot-maturity-benchmark.md`, `docs/product/figma-migration-roadmap.md`, and `docs/superpowers/PLAN_STATUS.md` for maturity tracking.

### Task 1: RED Tests

- [x] **Step 1: Write the web solver failing test**

Add `grid layout spans a manual child across multiple cells` to `apps/web/src/editor-state.test.ts`. Use a 390x220 frame with a 3x2 grid, 12 column gap, 10 row gap, 15/20 padding, and a text child at `grid_column: 1`, `grid_row: 1`, `grid_column_span: 2`, `grid_row_span: 2`, `width_sizing: "fill"`, `height_sizing: "fill"`, and margins `{ top: 5, right: 6, bottom: 7, left: 8 }`.

Expected after relayout:
- Text transform `{ x: 23, y: 25 }`.
- Text size `{ width: 222, height: 168 }`.
- First auto rectangle transform `{ x: 263, y: 20 }`.
- Second auto rectangle transform `{ x: 263, y: 115 }`.

- [x] **Step 2: Write the server failing test**

Add a dry-run `set_layout_item` coverage block in `apps/server/src/storage.test.ts` with the same grid geometry. Assert that `layout_item` preserves `grid_column_span: 2` and `grid_row_span: 2`, the text fills the 2x2 spanned area, and two created rectangles skip to column 3 row 1 and column 3 row 2.

- [x] **Step 3: Write the export and Rust failing tests**

Update `apps/server/src/code-export.test.ts` to include and expect `grid_column_span: 2` and `grid_row_span: 2` in `structure.children[0].layout_item`. Update `crates/editor-core/tests/document_model.rs` to parse, assert, and re-serialize those fields.

- [x] **Step 4: Write the Playwright CLI failing test**

Add `inspector grid item span stretches a child across multiple cells` to `apps/web/e2e/editor-mvp.spec.ts`. The test sets the frame to the same 3x2 grid, selects `헤드라인`, sets the new span controls to 2x2, sets item width/height sizing to `fill`, and asserts Inspector geometry `x=15`, `y=20`, `w=236`, `h=180`; then it creates a rectangle and asserts that the new auto item starts at `x=263`, `y=20`.

- [x] **Step 5: Verify RED**

Run:
```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts
cargo test -p editor-core layout_metadata_round_trips_through_json
```

Expected: failures mention missing span fields or wrong single-cell sizing/auto placement.

### Task 2: Shared Contracts

- [x] Add optional numeric `grid_column_span` and `grid_row_span` to TypeScript `NodeLayoutItem` in renderer and server storage.
- [x] Add optional numeric `grid_column_span` and `grid_row_span` to `apps/server/src/mcp.ts` `nodeLayoutItemSchema`.
- [x] Add `Option<u32>` fields to Rust `NodeLayoutItem` with `serde(default, skip_serializing_if = "Option::is_none")`.
- [x] Update `crates/editor-core/bindings/NodeLayoutItem.ts` to include nullable span fields.

### Task 3: Grid Span Solver

- [x] Replace one-cell `GridCell` manual reservation with a `GridPlacement` that stores `row`, `column`, `rowSpan`, and `columnSpan`.
- [x] Normalize spans as positive rounded integers with a default of 1 and clamp spans to the available tracks from the start cell.
- [x] Treat a child with any grid row/column/span field as manually placed, defaulting missing row/column to 1.
- [x] Reserve every cell covered by a manual placement before auto placement runs.
- [x] Compute placement width/height as `cellSize * span + gap * (span - 1)`.
- [x] Apply fill sizing and alignment against the full spanned inner area after margins.
- [x] Mirror the same solver behavior in `apps/web/src/editor-state.ts` and `apps/server/src/layout.ts`.

### Task 4: Inspector Controls

- [x] Extend `updateLayoutItemGridPlacement` in `apps/web/src/App.tsx` to accept `grid_column_span` and `grid_row_span`.
- [x] Add Korean inputs `그리드 열 범위` and `그리드 행 범위` beside the existing grid row/column placement controls.
- [x] Use `data-testid="inspector-layout-item-grid-column-span"` and `data-testid="inspector-layout-item-grid-row-span"`.
- [x] Default both span controls to `1` when no explicit span exists.

### Task 5: Verification and Documentation

- [x] Run focused GREEN checks: `pnpm --filter @layo/web test -- src/editor-state.test.ts`, `pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts`, and `cargo test -p editor-core layout_metadata_round_trips_through_json`.
- [x] Run type and maturity gates: `pnpm typecheck` and `pnpm run check:penpot-maturity`.
- [x] Run browser verification through Playwright CLI, including the focused grid span e2e case.
- [x] Run broad verification: `pnpm --filter @layo/web build`, `cargo test -p editor-core`, `pnpm test`, `git diff --check`, and `pnpm test:e2e`.
- [x] Update product docs so grid spans move into current capability while named areas, track units, and viewport grid editing remain explicit gaps.
- [x] Add this plan to `docs/superpowers/PLAN_STATUS.md` with verification evidence.


## Verification Evidence

- RED verified: web solver failed on single-cell fill size (`98x73` instead of `222x168`), server dropped span fields, and Rust lacked `grid_column_span`/`grid_row_span` fields.
- Focused GREEN: `pnpm --filter @layo/web test -- src/editor-state.test.ts`, `pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts`, and `cargo test -p editor-core layout_metadata_round_trips_through_json`.
- Type and maturity gates: `pnpm typecheck` and `pnpm run check:penpot-maturity`.
- Browser proof: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector grid item span stretches a child across multiple cells" --workers=1 --reporter=line`.
- Broad verification: `pnpm --filter @layo/web build`, `cargo test -p editor-core`, `pnpm --filter @layo/collaboration build`, `git diff --check`, `pnpm test`, and `pnpm test:e2e`.
