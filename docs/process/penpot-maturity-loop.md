# Penpot Maturity Loop

Use this process whenever Layo is compared against Penpot or when a missed
team-product behavior is discovered.

## Purpose

The goal is to keep Layo moving toward professional team-product maturity. A
gap is not closed because a similar-looking UI appears once. It is closed only
when the behavior is implemented in Layo's document model, human UI,
agent-control surface, tests, and verification evidence at the scope required by
the maturity gate.

## Required Loop

1. Identify the Penpot reference capability and source URL.
2. State whether Layo will adopt, adapt, or diverge from that capability.
3. Map the gap to a maturity gate in
   `docs/product/penpot-maturity-benchmark.md`.
4. Define the next concrete goal for the failed or missing behavior.
5. Write a failing unit, integration, or Playwright test before implementation
   when the behavior is testable.
6. Implement the smallest product-aligned slice that moves Layo toward the
   Penpot-comparable target.
7. Verify through the appropriate scope:
   - model/unit tests for document semantics,
   - server/MCP tests for agent-editable behavior,
   - Playwright CLI tests for visible interaction,
   - direct live UI interaction notes for editor behavior,
   - import/export artifact inspection when files or assets are involved.
8. If verification fails, keep the same failed case as the next goal and repeat
   the loop instead of switching to a smaller definition of done.
9. Update the benchmark, roadmap, plan status, and PR body with the gap,
   evidence, and remaining risks.

## Done Criteria

A Penpot-comparable gap is done only when:

- The desired behavior is named in product docs.
- The implementation exists outside transient UI-only state when document
  semantics are involved.
- Agents can inspect or mutate it through MCP/HTTP when the behavior affects
  saved design state.
- Regression tests fail before the fix and pass after the fix when practical.
- Browser-visible behavior has Playwright CLI proof.
- The PR body records the reference, failure or gap, verification, and any
  deliberate divergence from Penpot.

## Failure Handling

When a comparison or verification exposes a miss:

1. Do not reframe the miss as out of scope unless the benchmark explicitly says
   Layo will diverge.
2. Create the next goal from the exact failed case.
3. Keep the failed evidence attached to the new plan or PR.
4. Add a memory note only when the failure reflects agent workflow, repeated
   verification weakness, or user correction that should affect future sessions.

