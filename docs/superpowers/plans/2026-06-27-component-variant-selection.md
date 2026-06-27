# Component Variant Selection Implementation Plan

**Goal:** Make component variants selectable on component instances so Layo moves from storing variants to using them in the visible editor and developer handoff.

**Architecture:** Add an optional selected variant id to `ComponentInstance`, expose undoable web editor commands and right Inspector controls for selected component instances, persist the field through Rust/server/renderer contracts, and resolve selected variant properties in code export artifacts.

**Tech Stack:** TypeScript renderer/web/server, React Inspector, Fastify storage routes, Rust serde/ts-rs model, Playwright CLI.

## Context

Penpot-class component maturity lets users select a component instance and change its variant properties directly in the design tool. Layo already stores `ComponentDefinition.variants` and can export variant-aware code mappings, but instances do not yet remember which variant is selected, so exports fall back to the first component variant.

## Tasks

- [x] Add RED coverage for undoable web editor variant selection.
- [x] Add RED coverage for Rust JSON round-trip preservation.
- [x] Add RED coverage for code export resolving the selected instance variant.
- [x] Add RED Playwright CLI coverage for Inspector variant selection and Dev Panel usage.
- [x] Implement renderer, web, server, Rust, generated bindings, code export, and Inspector changes.
- [x] Update Penpot maturity docs and plan status.
- [x] Verify focused and full gates for PR readiness.

## Acceptance

- A component instance can store a selected `variant_id`.
- New component instances default to the first available component variant.
- Selecting a component instance shows variant property controls in the right Inspector.
- Changing a variant property updates the selected instance and remains undoable.
- Code export resolves repo mapping variant props from the selected instance variant instead of always using the first component variant.
- HTTP/server, Rust, renderer, and generated bindings preserve the selected variant id.

## Verification

RED checks observed before implementation:

- `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "sets a component instance variant"` failed because `set_component_instance_variant` had no command implementation.
- `cargo test -p editor-core component_document_round_trips_through_json` failed because `ComponentInstance` had no `variant_id` field.
- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "selected component instance variant"` failed because exported instance structures and repo mapping usage ignored the selected variant.
- `pnpm --filter @layo/server test -- src/http.test.ts -t "component variant definitions"` failed because component variant and instance variant HTTP routes did not exist.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line` failed after the first GREEN pass because the Inspector changed local state but did not persist the selected variant before Dev Panel export refresh.

GREEN checks observed:

- `pnpm --filter @layo/web test -- src/editor-state.test.ts -t "sets a component instance variant"`
- `cargo test -p editor-core component_document_round_trips_through_json`
- `cargo test -p editor-core export_bindings -- --nocapture`
- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "selected component instance variant"`
- `pnpm --filter @layo/server test -- src/http.test.ts -t "component variant definitions"`
- `pnpm --filter @layo/server test -- src/storage.test.ts -t "component"`
- `pnpm --filter @layo/web build`
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line`
- `pnpm test`
- `pnpm test:e2e`
