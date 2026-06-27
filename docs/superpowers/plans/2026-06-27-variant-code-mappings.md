# Variant Code Mappings Implementation Plan

**Goal:** Make saved repo component mappings variant-aware so design component variant properties flow into code export artifacts and the visible Dev Panel usage snippet.

**Architecture:** Extend `CodeComponentMapping` with saved `variant_props`, validate them through HTTP/MCP/storage/Rust, resolve default values from component variant properties during code export, and render/copy the resulting variant prop usage in the Inspector Dev Panel.

**Tech Stack:** TypeScript server, Fastify HTTP routes, MCP zod schema, Rust serde/ts-rs model, React Dev Panel, Playwright CLI.

## Context

Penpot-class component maturity treats variants as first-class design-system data, not just static component metadata. Layo already saves component variants and repo component mappings separately; this slice connects them so code handoff can express variant props such as `tone="primary"` or `surface="elevated"`.

## Tasks

- [x] Add RED coverage for variant-aware repo mapping code export artifacts.
- [x] Add RED coverage for HTTP persistence and export usage.
- [x] Add RED coverage for MCP save/list schema.
- [x] Add RED coverage for Rust JSON round-trip preservation.
- [x] Add RED Playwright CLI coverage for visible Dev Panel variant prop usage and copy.
- [x] Implement storage, HTTP, MCP, Rust, renderer, code export, and Dev Panel changes.
- [x] Update Penpot maturity docs and plan status.
- [x] Verify focused and full gates for PR readiness.

## Acceptance

- A saved mapping can declare `variant_props` that map Layo variant property names to code prop names.
- Code export resolves variant prop values from the component's saved variant properties when available, falling back to the mapping default value.
- Component definitions, component instances, implementation specs, and Dev Panel snippets expose the resolved variant props.
- HTTP, MCP, Rust, and renderer contracts preserve the new field.
- The Inspector Dev tab displays and copies variant-aware usage.

## RED Evidence

- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "variant-aware repo component mapping"` failed because exported mappings did not include `variantProps`.
- `pnpm --filter @layo/server test -- src/http.test.ts -t "repo component mappings"` failed because HTTP export usage stayed at `<Card title={title} />`.
- `pnpm --filter @layo/server test -- src/mcp.test.ts -t "repo component mappings|safety annotations"` failed because `variant_props` was not preserved by the MCP schema.
- `cargo test -p editor-core code_component_mappings_round_trip_through_json` failed because the Rust `CodeComponentMapping` model did not include `variant_props`.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line` failed because the visible Dev Panel mapping snippet omitted `surface="elevated"`.

## GREEN Evidence

- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "variant-aware repo component mapping"` passed.
- `pnpm --filter @layo/server test -- src/http.test.ts -t "repo component mappings"` passed.
- `pnpm --filter @layo/server test -- src/mcp.test.ts -t "repo component mappings|safety annotations"` passed.
- `cargo test -p editor-core code_component_mappings_round_trip_through_json` passed.
- `cargo test -p editor-core export_bindings -- --nocapture` passed and regenerated `CodeComponentMapping` plus `CodeComponentMappingVariantProp` bindings.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line` passed.

## Full Verification

- [x] `pnpm run check:penpot-maturity`
- [x] `pnpm run check:design-rules`
- [x] `pnpm typecheck`
- [x] `pnpm --filter @layo/web build`
- [x] `git diff --check`
- [x] `pnpm test`
- [x] `pnpm test:e2e`
- [x] `pnpm test:e2e:collab`
