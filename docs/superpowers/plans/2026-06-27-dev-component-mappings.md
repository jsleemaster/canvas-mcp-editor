# Dev Component Mappings Implementation Plan

**Goal:** Make repository component mappings a first-class Layo document concept so Dev Panel and HTTP/MCP code export can show which saved design components map to real code components.

**Architecture:** Store `code_mappings` on `DesignFile`, expose read/write APIs next to component routes, preserve the field through Rust JSON round trips, enrich code export structures with a normalized repo mapping artifact, and render the selected mapping in the Inspector Dev tab.

**Tech Stack:** TypeScript server, Fastify HTTP routes, MCP tools, Rust serde/ts-rs model, React Dev Panel, Playwright CLI.

## Context

Penpot-grade developer handoff needs more than generated CSS and static snippets. Teams need saved design components to point to repo components, import paths, props, and docs so design-to-code handoff does not become manual detective work.

## Tasks

- [x] Add RED coverage for code export repo mapping artifacts.
- [x] Add RED coverage for HTTP persistence and code export integration.
- [x] Add RED coverage for MCP mapping management.
- [x] Add RED coverage for Rust `DesignFile` JSON round-trip preservation.
- [x] Add RED Playwright CLI coverage for visible Dev Panel mapping and copy.
- [x] Implement storage, HTTP, MCP, Rust, renderer, code export, and Dev Panel changes.
- [x] Update Penpot maturity docs and plan status.
- [ ] Verify focused and full gates, then commit, push, PR, merge, and clean worktree.

## Acceptance

- A saved `code_mappings` entry links a Layo component id to a repo import, export name, props, and optional docs URL.
- HTTP and MCP can save and list mappings.
- Code export includes normalized mapping artifacts for component definitions and component instances.
- The Inspector Dev tab displays selected-layer code mapping and can copy the import/usage snippet.
- Rust model round-trips the new field without dropping it.

## RED Evidence

- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "repo component mappings"` failed because `component.repoMapping` was `undefined`.
- `pnpm --filter @layo/server test -- src/http.test.ts -t "repo component mappings"` failed because `PUT /files/:fileId/code-mappings` returned 404.
- `pnpm --filter @layo/server test -- src/mcp.test.ts -t "repo component mappings|safety annotations"` failed because the MCP mapping tools were not registered.
- `cargo test -p editor-core code_component_mappings_round_trip_through_json` failed because `DesignFile` had no `code_mappings` field.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line` failed because the mapping route did not exist.

## GREEN Evidence

- `pnpm --filter @layo/server test -- src/code-export.test.ts -t "repo component mappings"` passed.
- `pnpm --filter @layo/server test -- src/http.test.ts -t "repo component mappings"` passed.
- `pnpm --filter @layo/server test -- src/mcp.test.ts -t "repo component mappings|safety annotations"` passed.
- `cargo test -p editor-core code_component_mappings_round_trip_through_json` passed.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "repo code mappings" --workers=1 --reporter=line` passed.
