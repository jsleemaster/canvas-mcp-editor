# Penpot Token Set Modes Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Penpot-inspired token set and active mode baseline so imported DTCG token sets persist in Layo, resolve active overrides, and stay editable through the right Inspector and agent command surface.

**Architecture:** Keep Layo's existing color, spacing, and typography token primitives, then add `token_sets` metadata plus optional per-token `set_id`. DTCG import/export preserves ordered sets and enabled state, while code export, agent commands, and the web editor resolve active sets in order so later enabled sets override earlier enabled sets for the same token type and name.

**Tech Stack:** TypeScript storage/MCP/HTTP, React Inspector, Vitest, Playwright CLI, Rust serde/ts-rs document model.

## Global Constraints

- Use `docs/product/penpot-maturity-benchmark.md` and `docs/process/penpot-maturity-loop.md` for the maturity loop.
- Browser debugging and visual verification must use Playwright CLI.
- Preserve local-first saved document semantics.
- Keep web UI Korean-first.
- Existing single-set `global` token import/export must remain backward compatible.

---

## Penpot Comparison

- Reference capability: Penpot design tokens support token sets/themes and active set resolution as part of design-system workflows.
- Layo decision: adapt. Layo keeps deterministic saved document tokens and agent commands, but adds set ordering and enabled-state resolution before broader hosted library/theme sync.
- Maturity gate: Design systems.
- Remaining after this slice: reusable styles, explicit variant property type authoring, advanced matrix editing, and hosted library registry/update sync.

## Task 1: RED Tests

**Files:**
- Modify: `apps/server/src/design-token-io.test.ts`
- Modify: `apps/server/src/code-export.test.ts`
- Modify: `apps/server/src/storage.test.ts`
- Modify: `apps/web/src/editor-state.test.ts`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`
- Modify: `crates/editor-core/tests/document_model.rs`

- [x] Add failing tests proving:
  - DTCG import/export preserves ordered token sets and active set metadata.
  - Code export resolves active set overrides and omits disabled-set CSS variables.
  - Agent commands can toggle a token set and rematerialize bound token values.
  - Web editor state toggles token set enabled state with undo/redo.
  - Right Inspector shows imported token sets and persists enabled-state changes.
  - Rust document JSON round-trips token sets and token `set_id`.

- [x] Run focused tests and record expected RED failures.

## Task 2: Document Model And DTCG Semantics

**Files:**
- Modify: `packages/renderer/src/index.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/design-token-io.ts`
- Modify: `crates/editor-core/src/model.rs`
- Regenerate: `crates/editor-core/bindings/DesignFile.ts`
- Regenerate: `crates/editor-core/bindings/DesignToken.ts`
- Create/regenerate: `crates/editor-core/bindings/DesignTokenSet.ts`

- [x] Add `DesignTokenSet { id, name, enabled }`.
- [x] Add optional `DesignToken.set_id`.
- [x] Add optional document `token_sets`.
- [x] Add DTCG import result `{ tokens, tokenSets }` while preserving the legacy flat-token import adapter.
- [x] Export DTCG `$metadata.tokenSetOrder` and Layo extension `$metadata.activeTokenSets` when token sets exist.
- [x] Add active-token resolution helper where later enabled sets override earlier enabled sets by `type + name`.

## Task 3: Server Agent And Export Behavior

**Files:**
- Modify: `apps/server/src/code-export.ts`
- Modify: `apps/server/src/agent-control.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/mcp.ts`

- [x] Use active token resolution in CSS variables, code export metadata, and token reference lookup.
- [x] Add `set_token_set_enabled` agent command.
- [x] Validate duplicate token set ids and missing token-set references.
- [x] Materialize token-bound fills, spacing, and typography values after token-set toggles.
- [x] Return `tokenSets` in agent inspection and token import surfaces.

## Task 4: Web Inspector Behavior

**Files:**
- Modify: `apps/web/src/editor-state.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/document-api.ts`

- [x] Add undo/redo-safe `set_token_set_enabled` editor command.
- [x] Resolve active token options in the Inspector while keeping saved token set metadata.
- [x] Show token set rows in the existing right Inspector token section.
- [x] Persist enabled-state changes through the existing agent command HTTP path.

## Task 5: Verification, Docs, PR, Cleanup

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [x] Run focused server, web, Rust, and Playwright CLI tests.
- [x] Run `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, `pnpm typecheck`, `pnpm --filter @layo/web build`, `pnpm test`, and `git diff --check`.
- [x] Start local server only if browser-visible verification needs it; use Playwright CLI for direct interaction proof.
- [x] Commit, push, create PR via GitHub REST, review/merge, then clean the worktree and branch without `gh`.

## Verification Evidence

- Focused server: `pnpm --filter @layo/server test -- src/design-token-io.test.ts src/code-export.test.ts src/storage.test.ts --runInBand` passed with 114 tests.
- Focused web: `pnpm --filter @layo/web test -- src/editor-state.test.ts --runInBand` passed with 145 tests.
- Focused Rust: `cargo test -p editor-core token_sets_round_trip_through_json --test document_model` passed.
- Focused Playwright CLI: `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "right inspector manages imported DTCG token sets" --workers=1 --reporter=line` passed.
- Broad gates: `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`, `pnpm typecheck`, `pnpm --filter @layo/web build`, `pnpm test`, `cargo test --workspace`, and `git diff --check` passed.
- Full Playwright CLI: `pnpm test:e2e` passed with 124 tests.
