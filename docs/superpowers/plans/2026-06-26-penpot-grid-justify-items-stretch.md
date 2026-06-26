# Penpot Grid Justify Items Stretch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-like Grid container horizontal item alignment with `justify_items: stretch` across Layo's document model, human inspector UI, agent-editable surfaces, Rust model, and browser-visible behavior.

**Architecture:** Treat `justify_items` as a saved grid-container layout field, separate from flex-oriented `justify_content`. The grid solver uses it for the child X offset and width stretch; explicit child `width_sizing: fill` continues to work, and per-item `justify_self` remains a later slice.

**Tech Stack:** TypeScript renderer types, React inspector, Vitest, Fastify storage/MCP schemas, Rust `editor-core`, ts-rs bindings, Playwright CLI.

---

## Penpot Reference

- Source: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Capability: Grid container item alignment includes horizontal item alignment with start, center, end, and stretch behavior.
- Decision: Adopt the container-level grid `justify_items` concept now. Defer item-level self alignment until a separate maturity slice.
- Maturity gate: Layout maturity.

## File Map

- Modify: `packages/renderer/src/index.ts`
  - Add the `justify_items` document field to `NodeLayout`.
- Modify: `apps/web/src/editor-state.ts`
  - Normalize `justify_items`, use it for grid X alignment, and stretch child width when the container value is `stretch`.
- Modify: `apps/web/src/editor-state.test.ts`
  - Add RED/GREEN regression coverage for grid `justify_items: stretch`.
- Modify: `apps/web/src/App.tsx`
  - Add a grid-only inspector control with `data-testid="inspector-layout-grid-justify-items"`.
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
  - Add Playwright CLI coverage that selects grid stretch and observes the child width.
- Modify: `apps/server/src/storage.ts`
  - Mirror layout type, normalization, and grid solver semantics on the server.
- Modify: `apps/server/src/mcp.ts`
  - Accept `justify_items` in `set_layout`.
- Modify: `apps/server/src/storage.test.ts`
  - Add server/agent RED/GREEN coverage for saved `justify_items` and relayout.
- Modify: `apps/server/src/code-export.test.ts`
  - Prove structured export preserves `justify_items`.
- Modify: `crates/editor-core/src/model.rs`
  - Add `LayoutJustifyItems` and default it to `Start`.
- Modify: `crates/editor-core/src/lib.rs`
  - Re-export the Rust enum.
- Modify: `crates/editor-core/tests/document_model.rs`
  - Add Rust JSON round-trip and legacy default coverage.
- Modify/Create: `crates/editor-core/bindings/*`
  - Regenerate or update TypeScript bindings for `NodeLayout` and `LayoutJustifyItems`.
- Modify: `docs/product/penpot-maturity-benchmark.md`
  - Record the landed container-level grid item alignment slice and remaining gaps.
- Modify: `docs/superpowers/PLAN_STATUS.md`
  - Track this active plan and later completion evidence.

## Acceptance Criteria

- [ ] `justify_items: "stretch"` is saved in `NodeLayout` for grid containers.
- [ ] Web editor relayout stretches grid children horizontally to the cell content box unless child min/max limits constrain it.
- [ ] Server agent commands can set `justify_items` and preview the same stretched child geometry.
- [ ] Rust document model round-trips `justify_items` and legacy layout JSON defaults to `Start`.
- [ ] The inspector exposes a grid-only horizontal item alignment select with `stretch`.
- [ ] Playwright CLI e2e proves a user can select stretch and see the selected child width update.
- [ ] Product docs record the closed gap and remaining Penpot layout maturity gaps.

## Tasks

### Task 1: RED Model And Solver Tests

**Files:**
- Modify: `apps/web/src/editor-state.test.ts`
- Modify: `apps/server/src/storage.test.ts`
- Modify: `crates/editor-core/tests/document_model.rs`
- Modify: `apps/server/src/code-export.test.ts`

- [ ] **Step 1: Add failing web solver test**

Add a Vitest case named `grid layout justify_items stretch expands children horizontally within cells`. It sets a 320px-wide two-column grid with 10px horizontal padding, sets `justify_items: "stretch"`, leaves the child width fixed at 40px, triggers relayout, and expects the child width to become 150px at x=10.

- [ ] **Step 2: Add failing server solver test**

Add an `applyAgentCommands` dry-run case named around `grid justify_items stretch` that sets the same grid layout through `set_layout`, then expects layout preview to preserve `justify_items: "stretch"` and stretch `text-1` to width 150.

- [ ] **Step 3: Add failing Rust round-trip/default test**

Update the layout metadata test JSON with `"justify_items": "stretch"` and assert `LayoutJustifyItems::Stretch`. Update the legacy default test to assert `LayoutJustifyItems::Start`.

- [ ] **Step 4: Add failing code export preservation test**

Update the layout export fixture expectation so structured code export includes `justify_items: "stretch"` on a grid frame.

- [ ] **Step 5: Verify RED**

Run:

```bash
pnpm --dir apps/web exec vitest run src/editor-state.test.ts -t "grid layout justify_items stretch expands children horizontally within cells"
pnpm --filter @layo/server test -- src/storage.test.ts -t "grid justify_items stretch"
cargo test -p editor-core justify_items -- --nocapture
pnpm --filter @layo/server test -- src/code-export.test.ts -t "exports layout justify_items"
```

Expected: FAIL because `justify_items` is not typed, normalized, serialized, or used by the grid solver yet.

### Task 2: Implement Shared Layout Contract

**Files:**
- Modify: `packages/renderer/src/index.ts`
- Modify: `apps/web/src/editor-state.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `crates/editor-core/src/model.rs`
- Modify: `crates/editor-core/src/lib.rs`
- Modify/Create: `crates/editor-core/bindings/*`

- [ ] **Step 1: Add shared field and enum**

Add `justify_items?: "start" | "center" | "end" | "stretch"` to TypeScript layout types, add `LayoutJustifyItems` in Rust, default it to `Start`, and re-export it.

- [ ] **Step 2: Normalize layout**

Normalize the field in web/server layout normalizers. Keep the default value at `start`, and preserve non-default grid `justify_items` in saved layout state.

- [ ] **Step 3: Update grid solver**

In both web and server solvers, use `justify_items` for grid child X alignment. When it is `stretch`, set child width to the grid cell content width after margins and min/max constraints.

- [ ] **Step 4: Update MCP schema**

Allow `justify_items` in `set_layout` so agents can mutate the saved layout contract.

- [ ] **Step 5: Verify GREEN for model/server tests**

Run the focused Vitest, server, Rust, and export commands from Task 1 and confirm they pass.

### Task 3: Add Inspector And Browser Proof

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [ ] **Step 1: Add inspector control**

Show a grid-only select labeled in Korean for horizontal grid item alignment. Use `data-testid="inspector-layout-grid-justify-items"` and options `start`, `center`, `end`, `stretch`.

- [ ] **Step 2: Add Playwright RED/GREEN test**

Add an e2e test named `inspector grid justify items stretch expands child width` that creates a grid frame, selects stretch, selects the child, and expects inspector width `150`.

- [ ] **Step 3: Verify with Playwright CLI**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "inspector grid justify items stretch expands child width" --workers=1 --reporter=line
```

Expected after implementation: PASS, with the browser-visible width update proved through Playwright CLI.

### Task 4: Product Docs And Full Verification

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [ ] **Step 1: Update maturity benchmark**

Record container-level grid horizontal item alignment and stretch as landed. Keep per-item self alignment, baseline alignment, and deeper resizing semantics as remaining gaps.

- [ ] **Step 2: Update plan status**

Move this plan from Active to Completed only after all verification passes and the PR is merged.

- [ ] **Step 3: Run final verification**

Run:

```bash
pnpm --filter @layo/web typecheck
pnpm typecheck
pnpm run check:penpot-maturity
pnpm --filter @layo/web build
cargo test -p editor-core
pnpm test
pnpm test:e2e
git diff --check
```

- [ ] **Step 4: Commit, PR, merge, cleanup**

Commit, push, create a PR, review the changed files, merge it, sync `main`, delete the feature branch, prune worktrees, remove generated artifacts, stop dev servers, and verify ports `5173` and `4317` are clear.
