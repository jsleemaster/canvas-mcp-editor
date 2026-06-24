# Penpot Layout Item Margin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the next Penpot Flex layout gap by adding saved per-child `layout_item.margin` semantics to Layo auto layout across document types, web state, server agent commands, code export metadata, Rust serialization, and Inspector controls.

**Architecture:** Store margin on the child node as optional `layout_item` metadata, not on the parent layout, because Penpot/CSS Flex margins are item-level spacing. The parent auto-layout solver treats each child margin as part of that child's outer size when calculating main-axis flow, cross-axis alignment, and stretch sizing. This slice keeps single-line flex only; wrap, row/column gap split, reverse directions, absolute/static item controls, z-index, fit/fill sizing, and CSS Grid remain later Penpot-maturity gaps.

**Tech Stack:** TypeScript, React, Vitest, Playwright CLI, Rust serde/ts-rs, existing Layo layout helpers.

---

## Penpot Reference

Penpot Flexible Layouts, last checked 2026-06-24:

- Flex Layout properties include direction, align, justify, gap, padding, margin, and sizing.
- Penpot spacing controls include numeric inputs for paddings, margins, and gaps.
- Grid Layout also supports margin for grid elements, but this plan only adopts Flex item margin.

Source: https://help.penpot.app/user-guide/designing/flexible-layouts/

## Scope

This plan adopts:

- `layout_item.margin`: `{ top, right, bottom, left }` on `RendererNode` / `DesignNode` / Rust `Node`.
- `set_layout_item` agent and editor command for deterministic mutation.
- Auto-layout solver support for vertical and horizontal single-line flow.
- Inspector margin inputs for the selected node.
- Agent inspect/export surfaces that expose `layout_item` metadata.

This plan intentionally defers:

- margin drag handles or visible margin overlays,
- auto margins,
- reverse row/column,
- wrapping and align-content,
- row and column gap split,
- absolute/static layout item position controls,
- fit/fill sizing,
- CSS Grid.

## Files

- Modify: `packages/renderer/src/index.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/layout.ts`
- Modify: `apps/server/src/agent-control.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `apps/server/src/code-export.ts`
- Modify: `apps/server/src/code-export.test.ts`
- Modify: `apps/server/src/storage.test.ts`
- Modify: `apps/web/src/editor-state.ts`
- Modify: `apps/web/src/editor-state.test.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `crates/editor-core/src/model.rs`
- Modify: `crates/editor-core/src/lib.rs`
- Modify: `crates/editor-core/tests/document_model.rs`
- Modify generated bindings under `crates/editor-core/bindings/`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/product/figma-migration-roadmap.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

### Task 1: RED Web Layout State Coverage

- [x] **Step 1: Add failing editor-state tests**

Add tests in `apps/web/src/editor-state.test.ts` proving vertical margin flow:

```ts
test("auto layout includes child margins in flow and cross-axis position", () => {
  const document = sampleDocument();
  const frame = findNodeById(document, "frame-1") as any;
  frame.layout = {
    mode: "auto",
    direction: "vertical",
    gap: 12,
    padding: { top: 20, right: 20, bottom: 20, left: 20 },
    align_items: "start",
    justify_content: "start"
  };
  const text = findNodeById(document, "text-1") as any;
  text.layout_item = {
    margin: { top: 10, right: 8, bottom: 14, left: 6 }
  };
  frame.children.push({
    id: "rectangle-1",
    kind: "rectangle",
    name: "사각형",
    transform: { x: 0, y: 0, rotation: 0 },
    size: { width: 120, height: 40 },
    style: { fill: "#e0f2fe", stroke: null, stroke_width: 0, opacity: 1 },
    content: { type: "empty" },
    children: []
  });

  const relaid = executeEditorCommand(createEditorState(document), {
    type: "update_node_geometry",
    nodeId: "rectangle-1",
    patch: { width: 120 }
  });

  expect(findNodeById(relaid.document, "text-1")?.transform).toMatchObject({ x: 26, y: 30 });
  expect(findNodeById(relaid.document, "rectangle-1")?.transform).toMatchObject({ x: 20, y: 104 });
});
```

Add tests proving command/undo:

```ts
test("sets layout item margin through an editor command and supports undo", () => {
  const updated = executeEditorCommand(createEditorState(sampleDocument()), {
    type: "set_node_layout_item",
    nodeId: "text-1",
    layoutItem: { margin: { top: 10, right: 8, bottom: 14, left: 6 } }
  } as any);

  expect(findNodeById(updated.document, "text-1")?.layout_item).toEqual({
    margin: { top: 10, right: 8, bottom: 14, left: 6 }
  });

  const undone = undo(updated);
  expect(findNodeById(undone.document, "text-1")?.layout_item).toBeUndefined();
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
```

Expected: FAIL because `layout_item` and `set_node_layout_item` are not implemented, or because relayout ignores child margin.

### Task 2: GREEN Shared Layout Item Contract And Solver

- [x] **Step 1: Extend TypeScript node types**

Add:

```ts
export interface LayoutSpacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface NodeLayoutItem {
  margin: LayoutSpacing;
}
```

Then add `layout_item?: NodeLayoutItem | null` beside `layout` and `constraints` in renderer/server node types.

- [x] **Step 2: Normalize and apply margins in web/server relayout**

Implement `normalizeNodeLayoutItem`, defaulting missing margins to zero and clamping negative/invalid values to zero. Update both `apps/web/src/editor-state.ts` and `apps/server/src/layout.ts` so vertical and horizontal auto layout calculate each child's outer size as:

```ts
mainBefore + childMainSize + mainAfter
```

and cross-axis position as start/center/end/stretch over:

```ts
availableCross - crossBefore - crossAfter
```

- [x] **Step 3: Add editor command**

Add `set_node_layout_item` with undo in `apps/web/src/editor-state.ts`.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
```

Expected: PASS.

### Task 3: Server, Rust, Export, And UI Coverage

- [x] **Step 1: Add agent command and server tests**

Add `set_layout_item` to `apps/server/src/agent-control.ts` and `apps/server/src/mcp.ts`. Extend `apps/server/src/storage.test.ts` so an agent can set `layout_item.margin` on a child before creating another child and see deterministic child positions.

- [x] **Step 2: Add export coverage**

Update `apps/server/src/code-export.ts` and `apps/server/src/code-export.test.ts` so `implementationSpec.structure.layout_item` appears for nodes with margins.

- [x] **Step 3: Add Rust serialization coverage**

Add `NodeLayoutItem` to `crates/editor-core/src/model.rs`, export it from `lib.rs`, and update generated bindings. Add JSON round-trip coverage for `layout_item.margin`.

- [x] **Step 4: Add Inspector controls and e2e proof**

Add Korean-first `레이아웃 아이템` margin inputs to the Inspector with test ids:

- `inspector-layout-item-margin-top`
- `inspector-layout-item-margin-right`
- `inspector-layout-item-margin-bottom`
- `inspector-layout-item-margin-left`

Add Playwright coverage that selects a frame, enables auto layout, selects a child, sets margin values, creates another child, and verifies visible Inspector geometry values.

- [x] **Step 5: Verify full slice**

Run:

```bash
pnpm run check:penpot-maturity
pnpm --filter @layo/web test -- src/editor-state.test.ts
pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts
cargo test -p editor-core
pnpm typecheck
pnpm --filter @layo/web build
pnpm test
cargo test --workspace
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "layout item margin" --workers=1 --reporter=line
DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "layout item margin" --workers=1 --reporter=line
```

Expected: all pass.

## Self-Review

Spec coverage:

- Penpot comparison captured.
- Flex item margin selected as the next layout maturity gap.
- Document model, web, server, MCP, export, Rust, UI, and verification covered.

Placeholder scan:

- No TBD/TODO/fill-later language.

Type consistency:

- `layout_item` and `margin` are used consistently across TypeScript, Rust JSON, MCP/HTTP, code export, and UI controls.


## Verification Results

Verified on 2026-06-24:

- `pnpm run check:penpot-maturity` passed.
- `pnpm --filter @layo/web test -- src/editor-state.test.ts` passed.
- `pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts` passed.
- `cargo test -p editor-core` passed.
- `pnpm typecheck` passed.
- `pnpm --filter @layo/web build` passed.
- `pnpm test` passed.
- `cargo test --workspace` passed.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "layout item margin" --workers=1 --reporter=line` passed.
- `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "layout item margin" --workers=1 --reporter=line` passed.
- `pnpm test:e2e` passed after updating the MCP stdio E2E to switch to the Layers panel before selecting layer-list buttons.
