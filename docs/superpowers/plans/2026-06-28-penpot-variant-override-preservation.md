# Penpot Variant Override Preservation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve root and nested text overrides on component instances when switching variants, moving Layo closer to Penpot-compatible component behavior.

**Architecture:** Reuse the existing `component_instance.overrides` model. Extend the web reducer so `update_text` on the root text node of a component instance or on a nested node inside a component instance records a `field: "text"` override mapped back to the source node id while leaving existing variant selection semantics intact.

**Tech Stack:** React editor state reducer, TypeScript, Vitest, Playwright CLI.

---

## File Structure

- Modify `apps/web/src/editor-state.test.ts` for RED/GREEN reducer coverage.
- Modify `apps/web/src/editor-state.ts` to record text overrides for root and nested component-instance text edits.
- Modify `docs/product/penpot-maturity-benchmark.md` and `docs/superpowers/PLAN_STATUS.md` after verification.

## Minimal Change Ladder

1. The behavior needs to exist because `variant-area/source override preservation` is an explicit design-system maturity gap.
2. Layo already has `component_instance.overrides` and code export support.
3. Existing `update_text` and `set_component_instance_variant` commands are enough for this slice.
4. Extend the reducer with helper functions instead of adding new commands or schema.
5. Keep the slice to text content overrides; other override types remain future work.

### Task 1: RED Reducer Coverage

**Files:**
- Modify: `apps/web/src/editor-state.test.ts`

- [x] **Step 1: Add the failing test**

Add a test near existing component variant reducer tests:

```ts
test("preserves component instance text overrides while switching variants", () => {
  const document = sampleDocument();
  document.components = [
    {
      id: "component-1",
      name: "Card",
      source_node: structuredClone(document.pages[0].children[0]),
      variants: [
        { id: "variant-default", name: "Default", properties: [{ name: "surface", value: "flat" }] },
        { id: "variant-elevated", name: "Elevated", properties: [{ name: "surface", value: "elevated" }] }
      ]
    }
  ];
  document.pages[0].children[0].kind = "component";

  const instance = executeEditorCommand(createEditorState(document), {
    type: "create_component_instance",
    parentId: "page-1",
    definitionId: "component-1",
    instanceId: "instance-1",
    x: 520,
    y: 140
  });
  const edited = executeEditorCommand(instance, {
    type: "update_text",
    nodeId: "instance-1__text-1",
    value: "Custom headline"
  });
  const switched = executeEditorCommand(edited, {
    type: "set_component_instance_variant",
    nodeId: "instance-1",
    variantId: "variant-elevated"
  });

  const instanceNode = findNodeById(switched.document, "instance-1");
  const textNode = findNodeById(switched.document, "instance-1__text-1");
  expect(textNode?.content).toMatchObject({ type: "text", value: "Custom headline" });
  expect(instanceNode?.component_instance).toMatchObject({
    variant_id: "variant-elevated",
    overrides: [{ node_id: "text-1", field: "text", value: "Custom headline" }]
  });

  const undoneVariant = undo(switched);
  expect((findNodeById(undoneVariant.document, "instance-1")?.component_instance as any)?.variant_id).toBe(
    "variant-default"
  );
  expect(findNodeById(undoneVariant.document, "instance-1__text-1")?.content).toMatchObject({
    type: "text",
    value: "Custom headline"
  });

  const undoneText = undo(undoneVariant);
  expect(findNodeById(undoneText.document, "instance-1__text-1")?.content).toMatchObject({
    type: "text",
    value: "Layo"
  });
  expect((findNodeById(undoneText.document, "instance-1")?.component_instance as any)?.overrides).toEqual([]);
});
```

- [x] **Step 2: Verify RED**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "preserves component instance text overrides"
```

Expected: FAIL because `overrides` is still empty.

Observed: FAIL because the selected instance switched to `variant-elevated` but
`component_instance.overrides` remained `[]`.

A second RED case covered text layers used directly as component sources. That
case failed because the root instance id replaces the source root id, so the
initial helper could not map the edited instance root back to the source text
node.

### Task 2: Reducer Implementation

**Files:**
- Modify: `apps/web/src/editor-state.ts`

- [x] **Step 1: Add helper functions**

Add helpers that find the nearest component instance ancestor for a node id,
derive the source node id from Layo's `instanceId__sourceNodeId` convention, and
upsert/remove `field: "text"` overrides.

- [x] **Step 2: Update `update_text`**

When the edited node is inside a component instance, update that instance's
override list alongside the actual text value. Undo uses the same command and
must restore or remove the override based on the previous source value.

- [x] **Step 3: Verify GREEN**

Run:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "preserves component instance text overrides"
```

Expected: PASS.

Observed: PASS after adding the component instance owner lookup, source-node id
mapping for root and nested instance text, text override upsert/removal, and a
null guard for regular text nodes.

Focused regression checks also passed:

```bash
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "updates fill and text content"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "component"
pnpm --filter @layo/web test -- src/editor-state.test.ts -t "root text component instance overrides"
pnpm --filter @layo/server test -- src/code-export.test.ts -t "component"
pnpm --filter @layo/server test -- src/storage.test.ts -t "component"
```

### Task 3: Browser And Product Verification

**Files:**
- Modify: `docs/product/penpot-maturity-benchmark.md`
- Modify: `docs/superpowers/PLAN_STATUS.md`
- Modify: `docs/superpowers/plans/2026-06-28-penpot-variant-override-preservation.md`

- [x] **Step 1: Run focused browser coverage**

Run:

```bash
node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "right inspector authors component variants on selected main components|component variant matrix edits cells" --reporter=line
```

Expected: PASS.

Observed: PASS with 2 Playwright CLI tests, covering selected-main-component
variant authoring and matrix cell/property/variant editing.

Also ran direct Playwright API-log proof for selected-instance variant controls:

```bash
DEBUG=pw:api node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "right inspector authors component variants on selected main components" --workers=1 --reporter=line
```

Observed: PASS with visible `locator.fill`, `locator.click`, and
`locator.selectOption` interactions against the Inspector variant controls.

- [x] **Step 2: Run full gates**

Run:

```bash
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm typecheck
pnpm test
pnpm --filter @layo/web build
pnpm test:e2e
git diff --check
```

Expected: all pass.

Observed: all pass.

- `pnpm run check:penpot-maturity`
- `pnpm run check:design-rules`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @layo/web build`
- `pnpm test:e2e` with 133 passing tests
- `git diff --check`

- [ ] **Step 3: Publish**

Commit, push, create the PR with GitHub REST, merge, and run post-merge cleanup.
