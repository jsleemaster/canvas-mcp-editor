# Penpot Flex Fit Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like Flex `fit` width and height sizing for auto-layout containers while preserving fixed sizing as the default.

**Architecture:** Extend the existing `NodeLayout` contract with optional `width_sizing` and `height_sizing` fields. The web and server solvers keep current positioning behavior, then resize the auto-layout container to its content size when the matching axis is `fit`. The first slice supports fit sizing for current Flex flow semantics and keeps child fill sizing, min/max sizing, and grid sizing as later gaps.

**Tech Stack:** TypeScript, React, Fastify storage/MCP, Vitest, Playwright CLI, Rust `serde`/`ts-rs`.

---

## Penpot Reference

- Source: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Capability: Flex Layout properties list `Sizing: Fix/fit width, Fix/fit height`; Penpot also describes resizing and fitting content and containers automatically.
- Decision: Adopt container `fit` sizing first, adapted to Layo's existing numeric node size model by deriving fitted width/height from current child geometry, padding, margins, and gaps.
- Maturity gate: `docs/product/penpot-maturity-benchmark.md` gate 4, layout maturity.
- Minimal-change ladder: extend the existing layout metadata and solvers; do not introduce a second layout engine.
- Ponytail assessment: useful as a process guard, not as a Layo runtime dependency. Keep the adoption to the existing minimal-change ladder and PR evidence instead of adding plugin code to the product.

## Files

- Modify: `packages/renderer/src/index.ts` for optional `width_sizing` and `height_sizing`.
- Modify: `apps/server/src/storage.ts` to mirror the shared layout contract.
- Modify: `apps/server/src/mcp.ts` to accept optional sizing fields in `nodeLayoutSchema`.
- Modify: `apps/server/src/layout.ts` to normalize sizing and resize auto-layout containers after measuring content.
- Modify: `apps/server/src/storage.test.ts` and `apps/server/src/code-export.test.ts` for agent command and export coverage.
- Modify: `apps/web/src/editor-state.ts` to normalize sizing and resize auto-layout containers.
- Modify: `apps/web/src/editor-state.test.ts` for state-level RED/GREEN coverage.
- Modify: `apps/web/src/App.tsx` to add Korean Inspector selects for width/height sizing.
- Modify: `apps/web/e2e/editor-mvp.spec.ts` for Playwright CLI visible proof.
- Modify: `crates/editor-core/src/model.rs`, `crates/editor-core/src/lib.rs`, generated bindings, and `crates/editor-core/tests/document_model.rs` for Rust serialization.
- Modify: product docs and `docs/superpowers/PLAN_STATUS.md` after verification.

### Task 1: RED Tests

- [ ] Add `apps/web/src/editor-state.test.ts` coverage named `auto layout fits container size to direct children`.

```ts
frame.layout = {
  mode: "auto",
  direction: "vertical",
  align_items: "start",
  justify_content: "start",
  width_sizing: "fit",
  height_sizing: "fit",
  gap: 12,
  padding: { top: 20, right: 24, bottom: 20, left: 24 }
};
```

Expected size for one 120x40 text child plus one 80x30 rectangle:

```ts
{ width: 168, height: 122 }
```

- [x] Run `pnpm --filter @layo/web test -- src/editor-state.test.ts` and verify failure shows the frame still keeps its old fixed size.
- [x] Add server storage dry-run coverage with the same layout and expected size/layout metadata.
- [x] Run `pnpm --filter @layo/server test -- src/storage.test.ts` and verify failure shows sizing fields are dropped or ignored.
- [x] Add Rust JSON round-trip assertions for `width_sizing` and `height_sizing`.
- [x] Run `cargo test -p editor-core layout_metadata_round_trips_through_json` and verify failure shows missing fields.

### Task 2: GREEN Implementation

- [x] Add optional sizing fields to TypeScript `NodeLayout` contracts:

```ts
width_sizing?: "fixed" | "fit";
height_sizing?: "fixed" | "fit";
```

- [x] Add optional fields to MCP schema:

```ts
width_sizing: z.enum(["fixed", "fit"]).optional(),
height_sizing: z.enum(["fixed", "fit"]).optional(),
```

- [x] Normalize sizing in web/server layout modules with `fixed` as default, omitting default fields when serialized through normalization.
- [x] Measure content with existing child metrics, margins, row/column gaps, and padding.
- [x] Apply fitted size after positioning the current auto-layout children:

```ts
if (layout.width_sizing === "fit") {
  node.size.width = fittedWidth;
}
if (layout.height_sizing === "fit") {
  node.size.height = fittedHeight;
}
```

- [x] Add Rust enum `LayoutSizing` with serde snake_case and defaults to `Fixed`.

### Task 3: Inspector and Browser Proof

- [x] Add two Korean Inspector selects near geometry/layout controls:
  - `data-testid="inspector-layout-width-sizing"`, label `너비 크기`, options `고정`, `내용 맞춤`
  - `data-testid="inspector-layout-height-sizing"`, label `높이 크기`, options `고정`, `내용 맞춤`
- [x] Add Playwright CLI test that sets both sizing controls to `fit`, creates a second child, and verifies the selected frame's Inspector width/height shrink/grow to content.
- [x] Run focused Playwright CLI:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "fit sizing" --workers=1 --reporter=line
```

### Task 4: Verification, Docs, PR

- [x] Run focused tests:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts
cargo test -p editor-core layout_metadata_round_trips_through_json
cargo test -p editor-core
```

- [x] Run broader checks:

```bash
pnpm typecheck
pnpm run check:penpot-maturity
pnpm --filter @layo/web build
pnpm test
cargo test --workspace
git diff --check
pnpm test:e2e
```

- [x] Update `docs/product/penpot-maturity-benchmark.md`, `docs/product/figma-migration-roadmap.md`, and `docs/superpowers/PLAN_STATUS.md` with the landed fit-sizing slice and remaining layout gaps.
- [ ] Commit, push, create PR, merge, and run `docs/process/post-merge-cleanup.md`.
