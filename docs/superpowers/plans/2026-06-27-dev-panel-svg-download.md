# Dev Panel SVG Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Penpot-inspired selected-layer SVG download action to the visible Inspector Dev tab.

**Architecture:** Keep the existing server code export and copy controls intact, then add a client-side SVG artifact for the currently selected node using the same download helper patterns already used by Layo. The SVG is deterministic, includes the selected node id/name metadata, preserves basic geometry/fill/text content, and is verified through Playwright CLI download inspection.

**Tech Stack:** React, Vite, Playwright CLI, SVG, Layo renderer node metadata.

---

## Penpot Comparison

Reference capability: Penpot Dev tools and export flows let developers inspect selected layers and export SVG/assets from design objects.

Layo decision: **adapt**. Layo will not yet add a full export preset manager. This slice adds a focused Dev tab SVG download for the selected layer, using existing node geometry and style data as the first asset handoff artifact.

Maturity gate: **Developer handoff** in `docs/product/penpot-maturity-benchmark.md`.

Remaining after this slice: richer SVG fidelity for complex nested/group/image nodes, bitmap asset downloads, ready-for-dev annotations, webhooks/API stories, and repo component mappings.

## Files

- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Tasks

### Task 1: Lock Selected-Layer SVG Download With Playwright

- [x] Add a Playwright test named `inspector dev panel downloads the selected layer as svg`.
- [x] In the test, create a project, select `헤드라인`, open the `개발` tab, click `dev-panel-download-svg`, and capture the download.
- [x] Assert the suggested filename is `text-1.svg`.
- [x] Read the downloaded file and assert it contains:
  - `<svg`
  - `data-node-id="text-1"`
  - `aria-label="헤드라인"`
  - `Layo`
  - `#111827`
- [x] Assert `dev-panel-asset-status` reports `헤드라인 SVG 다운로드됨`.
- [x] Run the focused test and verify it fails because the download button does not exist yet:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector dev panel downloads the selected layer as svg" --workers=1 --reporter=line
```

### Task 2: Generate A Deterministic Selected-Node SVG

- [x] Add XML escaping helpers near existing download helpers in `apps/web/src/App.tsx`.
- [x] Add `svgForNode(node: RendererNode): string`.
- [x] For text nodes, render a `<text>` element with escaped text, fill, opacity, and a stable font size.
- [x] For non-text nodes, render a rounded `<rect>` element with fill and opacity.
- [x] Add selected node metadata to the root `<svg>`:
  - `data-node-id`
  - `data-node-name`
  - `aria-label`
  - `<title>`
- [x] Keep this slice intentionally single-node. Complex child traversal and image embedding remain later asset fidelity work.

### Task 3: Add The Dev Panel Download Action

- [x] Add `assetStatus` state inside `DevPanel`.
- [x] Reset `assetStatus` when the selected node changes.
- [x] Add a `downloadSelectedSvg` handler that calls `downloadBlob(new Blob([svgForNode(selectedNode)], { type: "image/svg+xml" }), `${selectedNode.id}.svg`)`.
- [x] Render an asset handoff section with:
  - `dev-panel-asset-status`
  - `dev-panel-download-svg`
  - visible label `SVG 다운로드`
- [x] Run the focused Playwright test and verify it passes.

### Task 4: Keep The UI Aligned With Design Rules

- [x] Add CSS for the asset handoff section using existing design tokens.
- [x] Reuse compact button styling where appropriate.
- [x] Run:

```bash
pnpm run check:design-rules
```

### Task 5: Update Maturity Documentation

- [x] Update `docs/product/penpot-maturity-benchmark.md` so Developer handoff says selected-layer SVG download exists.
- [x] Remove generic SVG download from the current highest-risk Developer handoff gap and leave bitmap asset downloads, richer annotations, webhooks/API stories, and repo component mappings.
- [x] Add this plan to `docs/superpowers/PLAN_STATUS.md` with verification evidence.
- [x] Run:

```bash
pnpm run check:penpot-maturity
```

### Task 6: Verify, Ship, Merge, And Clean Up

- [x] Run focused Playwright CLI.
- [x] Run web typecheck and build.
- [x] Run `pnpm test`.
- [x] Run `pnpm test:e2e`.
- [x] Run `git diff --check`.
- [ ] Commit as `feat: add dev panel svg download`.
- [ ] Push `codex/dev-panel-svg-download`.
- [ ] Create a PR through GitHub REST.
- [ ] Merge the PR through GitHub REST.
- [ ] Follow `docs/process/post-merge-cleanup.md`: update `main`, delete remote/local branch, remove the worktree, prune worktrees, and verify ports.
