# Dev Panel PNG Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Penpot-inspired selected-layer PNG download action to the visible Inspector Dev tab.

**Architecture:** Reuse the existing Konva-stage selected-object PNG export behavior that is currently available from the object context menu, and expose it from the Dev panel as an asset handoff action. The Dev panel remains a presentational component; App owns the stage crop/export callback because it has the current editor, viewport, stage size, and Konva stage refs.

**Tech Stack:** React, Vite, React Konva, Playwright CLI, PNG download artifact inspection.

---

## Penpot Comparison

Reference capability: Penpot Dev tools and export flows let developers inspect selected layers and export bitmap/vector assets from design objects.

Layo decision: **adapt**. Layo already has a selected-object PNG export path in the right-click object menu. This slice makes that asset export discoverable from the Dev tab and verifies the actual downloaded PNG bytes.

Maturity gate: **Developer handoff** in `docs/product/penpot-maturity-benchmark.md`.

Remaining after this slice: nested/image SVG fidelity, multi-format export presets, asset scale options, ready-for-dev annotations, webhooks/API stories, and repo component mappings.

## Files

- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Tasks

### Task 1: Lock Selected-Layer PNG Download With Playwright

- [x] Add a Playwright test named `inspector dev panel downloads the selected layer as png`.
- [x] In the test, create a project, select `헤드라인`, open the `개발` tab, click `dev-panel-download-png`, and capture the download.
- [x] Assert the suggested filename is `text-1.png`.
- [x] Read the downloaded file and assert the first eight bytes match the PNG signature:
  - `89 50 4e 47 0d 0a 1a 0a`
- [x] Assert `dev-panel-asset-status` reports `헤드라인 PNG 다운로드됨`.
- [x] Run the focused test and verify it fails because the PNG download button does not exist yet:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector dev panel downloads the selected layer as png" --workers=1 --reporter=line
```

### Task 2: Reuse The Selected-Node PNG Export Path

- [x] Add a small App-local helper that exports the selected node from a supplied `EditorState` using the existing `konvaStageRef`, `viewportBounds`, `getNodeBounds`, `stageSize`, `downloadDataUrl`, and overlay hiding logic.
- [x] Update the existing object-context PNG export to call the shared helper with `scopeStateToContextNode(currentEditor)`.
- [x] Add a Dev-panel PNG callback that calls the same helper with `editorRef.current`.
- [x] Keep status messages specific:
  - context menu: `${node.name} PNG 내보내기 완료`
  - Dev panel: `${node.name} PNG 다운로드됨`

### Task 3: Add The Dev Panel PNG Action

- [x] Add `onDownloadPng` prop to `DevPanel`.
- [x] Add a `PNG 다운로드` button with `data-testid="dev-panel-download-png"` in the existing asset handoff section.
- [x] Keep `SVG 다운로드` and `PNG 다운로드` grouped under the same `에셋` heading.
- [x] Pass the callback through every `DevPanel` render path in `Inspector`.
- [x] Run the focused Playwright test and verify it passes.

### Task 4: Update Maturity Documentation

- [x] Update `docs/product/penpot-maturity-benchmark.md` so Developer handoff says selected-layer PNG downloads exist.
- [x] Remove generic bitmap asset downloads from the highest-risk gap and leave nested/image fidelity, multi-format presets, scale options, annotations, webhooks/API, and repo mappings.
- [x] Add this plan to `docs/superpowers/PLAN_STATUS.md` with verification evidence.
- [x] Run:

```bash
pnpm run check:penpot-maturity
```

### Task 5: Verify, Ship, Merge, And Clean Up

- [x] Run focused Playwright CLI.
- [x] Run `pnpm run check:design-rules`.
- [x] Run web typecheck and build.
- [x] Run `pnpm test`.
- [x] Run `pnpm test:e2e`.
- [x] Run `git diff --check`.
- [ ] Commit as `feat: add dev panel png download`.
- [ ] Push `codex/dev-panel-png-download`.
- [ ] Create a PR through GitHub REST.
- [ ] Merge the PR through GitHub REST.
- [ ] Follow `docs/process/post-merge-cleanup.md`: update `main`, delete remote/local branch, remove the worktree, prune worktrees, and verify ports.
