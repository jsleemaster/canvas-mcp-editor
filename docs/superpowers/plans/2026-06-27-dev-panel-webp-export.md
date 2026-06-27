# Dev Panel WEBP Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-inspired selected-layer WEBP export to the visible Inspector Dev tab.

**Architecture:** Reuse the existing App-owned selected-node raster export crop logic that now supports PNG and JPEG, and extend it to WEBP. Keep SVG, PNG, JPEG, right-click PNG, and existing PNG/JPEG scale behavior unchanged; add a separate WEBP handoff action that uses the same selected-layer crop, current scale, WEBP MIME type, and `.webp` filename.

**Tech Stack:** React, Vite, React Konva, Playwright CLI, WEBP RIFF signature inspection.

---

## Penpot Comparison

Reference capability: Penpot exporting layers supports export presets with scale, suffix, and file formats including PNG, JPEG, WEBP, SVG, and PDF. Penpot Dev tools also expose export assets from the Inspect/Code flow.

Layo decision: **adapt**. Layo already exposes SVG, PNG, JPEG, and PNG/JPEG scale options in the Inspector Dev tab. This slice adds WEBP as the next raster format while preserving existing export behavior.

Maturity gate: **Developer handoff** in `docs/product/penpot-maturity-benchmark.md`.

Remaining after this slice: PDF exports, persistent multi-export presets, nested/image SVG/PNG/JPEG/WEBP fidelity, richer ready-for-dev annotations, webhooks/API stories, and repo component mappings.

## Files

- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Tasks

### Task 1: Lock WEBP Export With Playwright

- [x] Add a Playwright test named `inspector dev panel downloads the selected layer as webp`.
- [x] In the test, create a project, select `헤드라인`, open the `개발` tab, click `dev-panel-download-webp`, and capture the download.
- [x] Assert the suggested filename is `text-1.webp`.
- [x] Read the downloaded file and assert the RIFF/WEBP signature:
  - first four bytes decode to `RIFF`
  - bytes eight through eleven decode to `WEBP`
- [x] Assert `dev-panel-asset-status` reports `헤드라인 WEBP 다운로드됨`.
- [x] Run the focused test and verify it fails because the WEBP download button does not exist yet:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector dev panel downloads the selected layer as webp" --workers=1 --reporter=line
```

### Task 2: Extend Selected Raster Export To WEBP

- [x] Extend the raster MIME type in `downloadSelectionRasterFromState` from:
  - `image/png | image/jpeg`
  - to `image/png | image/jpeg | image/webp`
- [x] Update the default extension logic so:
  - `image/jpeg` becomes `jpg`
  - `image/webp` becomes `webp`
  - `image/png` stays `png`
- [x] Keep the quality option for lossy formats:
  - JPEG and WEBP use `quality: 0.92`
  - PNG keeps `quality: undefined`
- [x] Add `downloadSelectedNodeWebpFromDevPanel(scale)` that downloads:
  - `text-1.webp` at default 2x
  - `text-1@1x.webp` or `text-1@3x.webp` for explicit non-default scales
- [x] Return status `${node.name} WEBP${scale === 2 ? "" : ` ${scale}x`} 다운로드됨`.

### Task 3: Add The Dev Panel WEBP Action

- [x] Add `onDownloadWebp: (scale: PngExportScale) => string | null` to `DevPanel`.
- [x] Add a `WEBP 다운로드` button with `data-testid="dev-panel-download-webp"` beside PNG/JPEG actions.
- [x] Pass the callback through every `DevPanel` render path in `Inspector`.
- [x] Pass `onDownloadSelectedWebp={downloadSelectedNodeWebpFromDevPanel}` from `App` into `Inspector`.
- [x] Run focused Dev panel Playwright tests and verify:
  - WEBP test passes.
  - PNG test still passes.
  - JPEG test still passes.
  - PNG scale test still passes.

### Task 4: Update Maturity Documentation

- [x] Update `docs/product/penpot-maturity-benchmark.md` so Developer handoff says selected-layer WEBP export exists.
- [x] Reduce the highest-risk Developer handoff gap from WEBP/PDF exports to PDF exports plus persistent presets, nested fidelity, annotations, webhooks/API, and repo mappings.
- [x] Add this plan to `docs/superpowers/PLAN_STATUS.md` with verification evidence.
- [x] Run:

```bash
pnpm run check:penpot-maturity
```

### Task 5: Verify, Ship, Merge, And Clean Up

- [x] Run focused Playwright CLI.
- [x] Run `pnpm run check:design-rules`.
- [x] Run web typecheck and build.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test`.
- [x] Run `pnpm test:e2e`.
- [x] Run `git diff --check`.
- [ ] Commit as `feat: add dev panel webp export`.
- [ ] Push `codex/dev-panel-webp-export`.
- [ ] Create a PR through GitHub REST.
- [ ] Merge the PR through GitHub REST.
- [ ] Follow `docs/process/post-merge-cleanup.md`: update `main`, delete remote/local branch, remove the worktree, prune worktrees, and verify ports.
