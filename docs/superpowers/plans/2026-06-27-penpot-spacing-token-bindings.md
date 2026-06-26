# Penpot Spacing Token Bindings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class spacing tokens and layout gap/padding token bindings so Layo's design-system model moves beyond color-only tokens toward Penpot-comparable variables.

**Architecture:** Reuse the existing document-local `DesignToken`, layout, storage, MCP, HTTP, Inspector, and code-export primitives. Store token references beside materialized numeric layout values so rendering remains deterministic while agents and humans can see the variable binding.

**Tech Stack:** TypeScript, React, Fastify, MCP SDK, Rust serde model, Playwright CLI.

---

## Penpot Comparison

- Reference capability: Penpot design tokens support spacing/dimension values that can be applied to design-system-driven layout decisions.
- Adopt: first-class spacing token documents, DTCG dimension import/export, saved layout token references, and CSS-variable-backed export.
- Adapt: Layo stores document-local tokens and materialized numeric layout values instead of Penpot token sets, themes, modes, or libraries.
- Diverge for now: token aliases, modes, shared libraries, typography tokens, and Penpot/Figma importers remain later maturity gaps.
- Maturity gate: Design systems, layout maturity, developer handoff, and agent safety.

## Task 1: Model, Codec, and Validation

**Files:**
- Modify: `packages/renderer/src/index.ts`
- Modify: `apps/server/src/storage.ts`
- Modify: `apps/server/src/design-token-io.ts`
- Modify: `apps/server/src/agent-control.ts`
- Modify: `crates/editor-core/src/model.rs`
- Modify: `crates/editor-core/src/lib.rs`

- [x] **Step 1: Write failing tests**

Add focused tests for DTCG spacing import/export, Rust JSON round-trip, storage
agent commands, and validation of missing or wrong-type layout spacing token
references.

- [x] **Step 2: Implement model and codec**

Extend token types, add `layout.spacing_tokens`, normalize the field across
server/web layout helpers, and map DTCG `dimension`/`spacing` to Layo spacing
tokens.

- [x] **Step 3: Implement validation and agent commands**

Add `set_layout_spacing_token` so agents can bind one spacing token to all gaps
or all padding while validation rejects missing and color-token references.

## Task 2: HTTP, MCP, Web Inspector, and Export

**Files:**
- Modify: `apps/server/src/http.test.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `apps/server/src/mcp.test.ts`
- Modify: `apps/server/src/code-export.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/editor-state.ts`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [x] **Step 1: Extend HTTP and MCP coverage**

Verify DTCG spacing tokens round-trip through `GET`/`PUT
/files/:fileId/tokens/dtcg` and MCP `import_design_tokens`/
`export_design_tokens`, plus MCP `apply_agent_commands` spacing-token binding.

- [x] **Step 2: Add Inspector controls**

Show Korean-first spacing token selects in the selected frame Inspector and
clear token references when users manually override gap or padding values.

- [x] **Step 3: Add code export support**

Emit spacing token CSS custom properties and use them for bound layout gap and
padding declarations. Include layout spacing token refs in the structured
implementation spec.

- [x] **Step 4: Add Playwright CLI coverage**

Verify a live editor imports a DTCG spacing token, selects a frame, binds gap
and padding in the right Inspector, persists the layout refs, and exports DTCG
spacing JSON.

## Task 3: Verification, PR, Merge, Cleanup

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [x] **Step 1: Run focused verification**

```bash
pnpm --filter @layo/server test -- src/mcp.test.ts src/http.test.ts src/design-token-io.test.ts src/storage.test.ts src/code-export.test.ts
pnpm --filter @layo/web test -- src/editor-state.test.ts
cargo test -p editor-core
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "spacing token" --workers=1 --reporter=line
```

- [x] **Step 2: Run broad verification**

```bash
pnpm typecheck
pnpm run check:penpot-maturity
pnpm --filter @layo/web build
pnpm test
pnpm test:e2e
git diff --check
```

- [ ] **Step 3: Commit, push, PR, merge**

Create a PR that records the Penpot reference, minimal-change ladder decision,
RED/GREEN evidence, Playwright CLI proof, and remaining design-system gaps.

- [ ] **Step 4: Post-merge cleanup**

Run `docs/process/post-merge-cleanup.md` exactly and report retained cleanup
exceptions.
