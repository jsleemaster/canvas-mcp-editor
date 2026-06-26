# Penpot DTCG Token Import Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add W3C/DTCG JSON import and export for Layo color design tokens so token data can move through UI, HTTP, and MCP surfaces.

**Architecture:** Reuse the existing `DesignToken` document field, file storage persistence, HTTP file routes, MCP server, and Inspector-side panel patterns. Add a focused DTCG codec for color tokens only; keep Penpot token sets, themes, modes, typography, spacing, and library-level sharing as explicit follow-up gaps instead of inventing parallel document concepts now.

**Tech Stack:** TypeScript, Fastify, MCP SDK, React, Playwright, Node test runner.

---

## Penpot Comparison

- Reference capability: Penpot design tokens can be imported and exported as W3C/DTCG JSON.
- Adopt: DTCG token object shape with `$type` and `$value`.
- Adapt: Layo currently persists document-local color tokens only, so this slice imports and exports color tokens from a single `global` set.
- Diverge for now: Penpot `$metadata` token-set ordering, active themes, modes, typography tokens, spacing tokens, and shared-library distribution stay on the maturity benchmark as later design-system work.
- Maturity gate: Design systems and import/export maturity.

## Task 1: DTCG Codec and Storage

**Files:**
- Create: `apps/server/src/design-token-io.ts`
- Test: `apps/server/src/design-token-io.test.ts`
- Modify: `apps/server/src/storage.ts`

- [ ] **Step 1: Write failing codec/storage tests**

Add tests proving nested DTCG color token export and import:

```ts
test("exports color tokens as nested DTCG JSON", () => {
  expect(
    exportColorTokensToDtcg([
      { id: "color-brand-primary", name: "Brand / Primary", type: "color", value: "#2563eb" }
    ])
  ).toMatchObject({
    $metadata: { tokenSetOrder: ["global"], activeThemes: [] },
    global: { Brand: { Primary: { $type: "color", $value: "#2563eb" } } }
  });
});
```

- [ ] **Step 2: Run RED**

Run: `pnpm --filter @layo/server test -- src/design-token-io.test.ts`

Expected: FAIL because `design-token-io.ts` does not exist yet.

- [ ] **Step 3: Implement focused codec and storage methods**

Implement `exportColorTokensToDtcg`, `importColorTokensFromDtcg`, `FileStorage.exportTokensDtcg`, and `FileStorage.importTokensDtcg`.

- [ ] **Step 4: Run GREEN**

Run: `pnpm --filter @layo/server test -- src/design-token-io.test.ts`

Expected: PASS.

## Task 2: HTTP and MCP Surfaces

**Files:**
- Modify: `apps/server/src/http.ts`
- Modify: `apps/server/src/http.test.ts`
- Modify: `apps/server/src/mcp.ts`
- Modify: `apps/server/src/mcp.test.ts`

- [ ] **Step 1: Write failing HTTP and MCP tests**

Add tests for:

- `GET /files/:fileId/tokens/dtcg`
- `PUT /files/:fileId/tokens/dtcg`
- MCP `export_design_tokens`
- MCP `import_design_tokens`

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm --filter @layo/server test -- src/http.test.ts --test-name-pattern "DTCG"
pnpm --filter @layo/server test -- src/mcp.test.ts --test-name-pattern "design tokens"
```

Expected: FAIL because the routes and MCP tools are missing.

- [ ] **Step 3: Implement HTTP and MCP integration**

Add same-origin routes and MCP tools that call the storage methods without duplicating token parsing logic.

- [ ] **Step 4: Run GREEN**

Run the same focused commands and expect PASS.

## Task 3: Web UI Import Export Controls

**Files:**
- Modify: `apps/web/src/document-api.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/e2e/editor-mvp.spec.ts`

- [ ] **Step 1: Write failing Playwright e2e**

Add a Playwright test that creates a project, opens the editor, exports DTCG JSON, imports a new DTCG JSON color token, and verifies the visible token JSON/status in the right-side panel.

- [ ] **Step 2: Run RED**

Run:

```bash
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "DTCG token" --workers=1 --reporter=line
```

Expected: FAIL because no token import/export UI exists.

- [ ] **Step 3: Implement compact Korean-first controls**

Add right-side design-system controls with:

- `토큰 내보내기`
- `토큰 가져오기`
- editable JSON textarea
- status text for imported token count or validation error

- [ ] **Step 4: Run GREEN and live Playwright CLI proof**

Run the focused e2e command and then a direct Playwright CLI interaction pass against the live editor.

## Task 4: Documentation, Verification, PR, Merge, Cleanup

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`

- [ ] **Step 1: Update product docs**

Record color-token DTCG import/export as shipped and keep remaining design-system gaps explicit.

- [ ] **Step 2: Run focused and broad verification**

Run:

```bash
pnpm --filter @layo/server test -- src/design-token-io.test.ts
pnpm --filter @layo/server test -- src/http.test.ts --test-name-pattern "DTCG"
pnpm --filter @layo/server test -- src/mcp.test.ts --test-name-pattern "design tokens"
pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "DTCG token" --workers=1 --reporter=line
pnpm typecheck
pnpm test
pnpm --filter @layo/web build
git diff --check
```

- [ ] **Step 3: Commit, push, PR, review, merge**

Create a PR with Penpot reference, minimal-change ladder decision, test evidence, and remaining divergences.

- [ ] **Step 4: Post-merge cleanup**

Run `docs/process/post-merge-cleanup.md` exactly and report retained exceptions.
