# Dev Panel Nested Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make selected frame/group SVG and PDF exports include nested child layers instead of exporting only the selected parent shape.

**Architecture:** Extract App-local SVG/PDF artifact generation into a focused `node-artifacts` module and make it recursively render child nodes using parent-relative transforms. Keep raster export unchanged for this slice; image embedding remains a later fidelity gap.

**Tech Stack:** React, TypeScript, Vitest, Playwright CLI, Vite browser downloads.

---

## Penpot Reference

- Penpot supports layer export presets and export formats including SVG and PDF.
- Layo adapts that behavior through Dev Panel exports and export preset ZIP review; this slice closes the fidelity gap where selected parent frames/groups did not include their nested contents.

## Files

- Create: `apps/web/src/node-artifacts.test.ts`
- Create: `apps/web/src/node-artifacts.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Task 1: Unit-Test Nested Artifact Rendering

- [x] **Step 1: Write the failing unit tests**

Create `apps/web/src/node-artifacts.test.ts` with a frame fixture containing a nested text node and rectangle. Assert `svgForNode(frame)` includes `data-node-id="text-1"`, `transform="translate(24 32)"`, nested text, child rectangle metadata, stroke, and child fill. Assert `pdfForNode(frame)` includes the selected frame title plus nested child text and child color drawing commands.

- [x] **Step 2: Run RED unit test**

Run:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts
```

Expected: FAIL because `./node-artifacts` does not exist or because nested children are missing.

Observed: FAIL because `./node-artifacts` did not exist.

- [x] **Step 3: Implement recursive artifact generation**

Created `apps/web/src/node-artifacts.ts` with exported `svgForNode(node)` and `pdfForNode(node)`. Render the selected node root and recursively render `children` in document order under parent-relative translate/rotate transforms.

- [x] **Step 4: Run GREEN unit test**

Run:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts
```

Expected: PASS.

Observed: PASS.

## Task 2: Wire Dev Panel Downloads To The Shared Renderer

- [x] **Step 1: Replace App-local helpers**

Import `svgForNode` and `pdfForNode` from `./node-artifacts` in `apps/web/src/App.tsx`; remove local `escapeSvgText`, `svgOpacityAttribute`, `svgForNode`, `pdfEscapeString`, `pdfColorOperands`, and `pdfForNode`.

- [x] **Step 2: Run focused regression tests**

Run:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts src/export-presets.test.ts
```

Expected: PASS.

Observed: PASS.

## Task 3: Browser-Prove Nested Selected Frame Downloads

- [x] **Step 1: Add Playwright coverage**

Extend `apps/web/e2e/editor-mvp.spec.ts` near the existing SVG/PDF download tests. Select `frame-1`, download SVG and PDF from the Dev Panel, and assert the downloaded artifacts include the nested `text-1`/`헤드라인` content instead of only the frame shell.

- [x] **Step 2: Run RED/GREEN Playwright CLI proof**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "nested child layers" --reporter=line
```

Expected after implementation: PASS.

Observed: first run failed because the local dev server was not running. After `pnpm dev` readiness passed, the Playwright CLI proof passed.

## Task 4: Product Documentation And Full Verification

- [x] **Step 1: Update maturity docs**

Record that nested frame/group SVG/PDF export fidelity has landed, while true image embedding and raster child fidelity remain open gaps.

- [x] **Step 2: Run verification gates**

Run:

```bash
pnpm --filter @layo/web test -- src/node-artifacts.test.ts src/export-presets.test.ts
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "nested child layers" --reporter=line
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm --filter @layo/web typecheck
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
git diff --check
```

Expected: all pass.

Observed:

- PASS: `pnpm --filter @layo/web test -- src/node-artifacts.test.ts src/export-presets.test.ts`
- PASS: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "nested child layers" --reporter=line`
- PASS: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector dev panel downloads the selected layer as (svg|pdf)|nested child layers" --reporter=line`
- PASS: `pnpm run check:penpot-maturity`
- PASS: `pnpm run check:design-rules`
- PASS: `pnpm --filter @layo/web typecheck`
- PASS: `pnpm --filter @layo/web build`
- PASS: `pnpm typecheck`
- PASS: `pnpm test`
- PASS: `pnpm test:e2e` with 113 tests
- PASS: `git diff --check`
