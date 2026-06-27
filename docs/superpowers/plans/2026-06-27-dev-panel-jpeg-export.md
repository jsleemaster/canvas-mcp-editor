# Dev Panel JPEG Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Penpot-inspired selected-layer JPEG export to the visible Inspector Dev tab.

**Architecture:** Reuse the existing App-owned selected-node raster export crop logic, but generalize it from PNG-only to raster formats. Keep right-click PNG export and existing Dev panel PNG behavior unchanged; add a separate JPEG handoff action that uses the same selected-layer crop, current scale, JPEG MIME type, and `.jpg` filename.

**Tech Stack:** React, Vite, React Konva, Playwright CLI, JPEG magic-byte inspection.

---

## Penpot Comparison

Reference capability: Penpot exporting layers supports export presets with scale, suffix, and file formats including PNG, JPEG, WEBP, SVG, and PDF.

Layo decision: **adapt**. Layo already exposes SVG and PNG with PNG scale options. This slice adds JPEG as the first raster format beyond PNG while preserving existing PNG behavior.

Maturity gate: **Developer handoff** in `docs/product/penpot-maturity-benchmark.md`.

Remaining after this slice: WEBP/PDF format presets, persistent multi-export presets, nested/image SVG/PNG/JPEG fidelity, richer ready-for-dev annotations, webhooks/API stories, and repo component mappings.

## Files

- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

## Tasks

### Task 1: Lock JPEG Export With Playwright

- [x] Add a Playwright test named `inspector dev panel downloads the selected layer as jpeg`.
- [x] In the test, create a project, select `헤드라인`, open the `개발` tab, click `dev-panel-download-jpeg`, and capture the download.
- [x] Assert the suggested filename is `text-1.jpg`.
- [x] Read the downloaded file and assert the first three bytes match the JPEG SOI/JFIF-style marker prefix:
  - `ff d8 ff`
- [x] Assert `dev-panel-asset-status` reports `헤드라인 JPEG 다운로드됨`.
- [x] Run the focused test and verify it fails because the JPEG download button does not exist yet:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "inspector dev panel downloads the selected layer as jpeg" --workers=1 --reporter=line
```

### Task 2: Generalize Selected Raster Export

- [x] Rename the App-local PNG helper conceptually to support raster export while preserving callers:
  - Keep context-menu PNG behavior and filenames unchanged.
  - Keep Dev panel PNG 2x/default behavior unchanged.
- [x] Add a raster format type with at least:
  - PNG: MIME `image/png`, extension `png`
  - JPEG: MIME `image/jpeg`, extension `jpg`
- [x] Make the helper accept `mimeType`, `filename`, and `failureLabel`, then pass the MIME type into `stage.toDataURL`.
- [x] Add `downloadSelectedNodeJpegFromDevPanel(scale)` that uses the selected Dev panel scale and downloads:
  - `text-1.jpg` at default 2x
  - `text-1@1x.jpg` or `text-1@3x.jpg` for explicit non-default scales
- [x] Return status `${node.name} JPEG${scale === 2 ? "" : ` ${scale}x`} 다운로드됨`.

### Task 3: Add The Dev Panel JPEG Action

- [x] Add `onDownloadJpeg: (scale: PngExportScale) => string | null` to `DevPanel`.
- [x] Add a `JPEG 다운로드` button with `data-testid="dev-panel-download-jpeg"` beside SVG/PNG actions.
- [x] Pass the callback through every `DevPanel` render path in `Inspector`.
- [x] Run focused Dev panel Playwright tests and verify:
  - JPEG test passes.
  - PNG tests still pass.
  - PNG scale test still passes.

### Task 4: Update Maturity Documentation

- [x] Update `docs/product/penpot-maturity-benchmark.md` so Developer handoff says selected-layer JPEG export exists.
- [x] Reduce the highest-risk Developer handoff gap from generic multi-format export presets to WEBP/PDF/persistent preset gaps plus nested fidelity, annotations, webhooks/API, and repo mappings.
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
- [ ] Commit as `feat: add dev panel jpeg export`.
- [ ] Push `codex/dev-panel-jpeg-export`.
- [ ] Create a PR through GitHub REST.
- [ ] Merge the PR through GitHub REST.
- [ ] Follow `docs/process/post-merge-cleanup.md`: update `main`, delete remote/local branch, remove the worktree, prune worktrees, and verify ports.
