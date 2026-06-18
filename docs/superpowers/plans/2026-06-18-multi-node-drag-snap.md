# Multi-Node Drag And Snap Guides Plan

Date: 2026-06-18
Spec: `docs/superpowers/specs/2026-06-18-multi-node-drag-snap-design.md`

## Steps

- [x] Add unit tests for moving multiple selected nodes through one batch geometry command.
- [x] Add unit tests for snap delta and guide calculation against unselected nodes.
- [x] Add Playwright e2e for Shift-selected layers dragging together and showing snap guide overlays.
- [x] Implement selected-node group translation helpers in `apps/web/src/editor-state.ts`.
- [x] Implement drag session handling and transient snap guide overlays in `apps/web/src/App.tsx`.
- [x] Add focused CSS for snap guide overlays.
- [x] Run focused tests, full repo checks, and direct headed Playwright CLI interaction verification.
- [x] Push branch, create PR, merge, and update `PLAN_STATUS.md`.
