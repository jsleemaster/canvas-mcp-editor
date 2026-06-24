# Penpot Flex Wrap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close the next Penpot Flex layout gap by adding saved `layout.wrap` and `layout.align_content` semantics so auto-layout children can flow across multiple lines/columns when the container runs out of main-axis space.

**Architecture:** Extend the shared `NodeLayout` contract with optional `wrap: "nowrap" | "wrap"` and `align_content` using the same distribution values as Penpot/CSS Flexbox. Preserve legacy documents by defaulting missing `wrap` to `nowrap` and missing `align_content` to `start`; use the existing single `gap` value as both main-axis and line gap until row/column gap split lands in a later slice. The web and server layout solvers should use the same deterministic line-building algorithm so MCP/HTTP, local editor state, code export, Rust JSON, and Playwright-observed UI stay aligned.

**Tech Stack:** TypeScript, React, Vitest, Playwright CLI, Rust serde/ts-rs, existing Layo layout helpers.

---

## Penpot Reference

Penpot Flexible Layouts, checked 2026-06-24:

- Flex Layout is based on CSS Flexbox and includes direction, wrap, align items, justify content, gap, padding, margin, and sizing.
- Wrap is documented as a direction-related Flex property with align-content options: start, center, end, space-around, and space-between.
- Penpot examples describe wrapping elements by using wrap with row direction to position elements in multiple lines.
- This slice adopts `wrap` and `align_content`; row/column gap split and fit/fill sizing remain deferred.

Source: https://help.penpot.app/user-guide/designing/flexible-layouts/

## Scope

This plan adopts:

- `layout.wrap`: `"nowrap" | "wrap"` on renderer/server/Rust layout models.
- `layout.align_content`: `"start" | "center" | "end" | "space_between" | "space_around" | "space_evenly"` for distributing wrapped lines along the cross axis.
- Web and server auto-layout solvers that keep existing single-line behavior when `wrap` is omitted or `nowrap`, and create multiple rows/columns when `wrap` is `wrap`.
- Inspector controls for selected frame wrap and wrapped-line distribution.
- MCP/schema/Rust/generated binding/code-export preservation of the new metadata.
- Focused unit/server/Rust/e2e coverage plus full verification.

This plan intentionally defers:

- Separate row gap and column gap fields.
- Reverse row/column directions.
- Fit/fill sizing and intrinsic measurement.
- Full CSS flex-grow/flex-shrink/basis behavior.
- CSS Grid.

## Files

- Modify: `packages/renderer/src/index.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/layout.ts`
- Modify: `apps/server/src/mcp.ts`
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

### Task 1: RED Web Wrap Coverage

- [x] **Step 1: Add failing editor-state tests**

Add a test proving horizontal wrapping creates a second row and reuses `gap` as the row gap:

```ts
test("auto layout wraps horizontal children into new rows", () => {
  const document = sampleDocument();
  const frame = findNodeById(document, "frame-1");
  expect(frame).toBeTruthy();
  frame!.size = { width: 180, height: 220 };
  frame!.layout = {
    mode: "auto",
    direction: "horizontal",
    wrap: "wrap",
    align_content: "start",
    align_items: "start",
    justify_content: "start",
    gap: 12,
    padding: { top: 20, right: 20, bottom: 20, left: 20 }
  };
  const text = findNodeById(document, "text-1");
  expect(text).toBeTruthy();
  text!.size = { width: 90, height: 40 };
  frame!.children.push({
    id: "wrap-rectangle-1",
    kind: "rectangle",
    name: "줄바꿈 사각형 1",
    transform: { x: 0, y: 0, rotation: 0 },
    size: { width: 90, height: 40 },
    style: { fill: "#e0f2fe", stroke: null, stroke_width: 0, opacity: 1 },
    content: { type: "empty" },
    children: []
  });
  frame!.children.push({
    id: "wrap-rectangle-2",
    kind: "rectangle",
    name: "줄바꿈 사각형 2",
    transform: { x: 0, y: 0, rotation: 0 },
    size: { width: 90, height: 40 },
    style: { fill: "#fde68a", stroke: null, stroke_width: 0, opacity: 1 },
    content: { type: "empty" },
    children: []
  });

  const relaid = executeEditorCommand(createEditorState(document), {
    type: "update_node_geometry",
    nodeId: "wrap-rectangle-2",
    patch: { width: 90 }
  });

  expect(findNodeById(relaid.document, "text-1")?.transform).toMatchObject({ x: 20, y: 20 });
  expect(findNodeById(relaid.document, "wrap-rectangle-1")?.transform).toMatchObject({ x: 20, y: 72 });
  expect(findNodeById(relaid.document, "wrap-rectangle-2")?.transform).toMatchObject({ x: 20, y: 124 });
});
```

Add a command/normalization test proving `wrap` and `align_content` persist through `set_node_layout` and undo.

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
```

Expected: FAIL because `wrap` and `align_content` are not typed and the solver still lays out one line.

### Task 2: GREEN Shared Contract And Solver

- [x] **Step 1: Extend TypeScript node types**

Update `NodeLayout` in renderer and server storage:

```ts
wrap?: "nowrap" | "wrap";
align_content?: "start" | "center" | "end" | "space_between" | "space_around" | "space_evenly";
```

- [x] **Step 2: Normalize wrap defaults**

Update web/server `normalizeNodeLayout` so missing or invalid `wrap` becomes omitted/`nowrap` behavior and missing or invalid `align_content` becomes `start`.

- [x] **Step 3: Implement shared deterministic wrap behavior**

Build flow lines from static children. For horizontal layout, start a new row when the next child plus margins would exceed available width and the current row already has at least one child. For vertical layout, start a new column when the next child plus margins would exceed available height. Within each line, apply existing `justify_content` on the main axis. Across lines, use `align_content` and the existing `gap` as the cross-axis line gap. Absolute children remain excluded.

- [x] **Step 4: Verify GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts
```

Expected: PASS.

### Task 3: Server, Rust, Export, And Inspector Coverage

- [x] **Step 1: Add server command tests**

Extend `apps/server/src/storage.test.ts` so an agent sets `wrap: "wrap"` and creates enough children to prove later children move to new rows/columns.

- [x] **Step 2: Add export coverage**

Update `apps/server/src/code-export.test.ts` fixture expectations so `implementationSpec.structure.layout.wrap` and `align_content` are preserved.

- [x] **Step 3: Add Rust serialization coverage**

Add `LayoutWrap` and `LayoutAlignContent` or equivalent serde-safe fields to `NodeLayout`, export them from `lib.rs`, regenerate bindings, and update JSON round-trip coverage.

- [x] **Step 4: Add Inspector controls and e2e proof**

Add Korean-first controls under `레이아웃`:

- `data-testid="inspector-layout-wrap"`, options `nowrap` = `한 줄`, `wrap` = `줄바꿈`
- `data-testid="inspector-layout-align-content"`, options matching `align_content`

Add Playwright coverage that selects a frame, enables horizontal auto layout, enables wrap, sets a narrow width, creates enough children, and verifies the second/third child appears on later rows through Inspector X/Y values.

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
git diff --check
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "wrap" --workers=1 --reporter=line
DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "wrap" --workers=1 --reporter=line
pnpm test:e2e
```


## Verification Results

Completed 2026-06-24.

- RED confirmed before implementation:
  - `pnpm --filter @layo/web test -- src/editor-state.test.ts` failed because children stayed in one line and `wrap`/`align_content` were dropped by normalization.
  - `pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts` failed because server command layout normalization dropped `wrap` and `align_content`.
  - `cargo test -p editor-core layout_metadata_round_trips_through_json` failed because `LayoutWrap`, `LayoutAlignContent`, and the corresponding fields did not exist.
- GREEN verification passed:
  - `pnpm --filter @layo/web test -- src/editor-state.test.ts`
  - `pnpm --filter @layo/server test -- src/storage.test.ts src/code-export.test.ts`
  - `cargo test -p editor-core layout_metadata_round_trips_through_json`
  - `cargo test -p editor-core`
  - `pnpm typecheck`
  - `pnpm run check:penpot-maturity`
  - `pnpm --filter @layo/web build`
  - `pnpm test`
  - `cargo test --workspace`
  - `git diff --check`
  - `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "wraps children" --workers=1 --reporter=line`
  - `DEBUG=pw:api pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "wraps children" --workers=1 --reporter=line`
  - `pnpm test:e2e`
