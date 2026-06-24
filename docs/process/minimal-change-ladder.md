# Minimal Change Ladder

Use this guard before adding code to Layo. It is inspired by Ponytail's agent
rules, but adapted for this product: smaller diffs are valuable only when they
preserve Penpot-comparable behavior, deterministic agent control, and browser
verification.

## Purpose

Layo should avoid accidental overbuilding while still moving toward a mature
team design product. The point is not to write clever one-liners. The point is
to reuse the strongest existing primitive before creating a new abstraction.

## Required Ladder

Before implementation, stop at the first rung that satisfies the request:

1. Does this behavior need to exist for the current product goal? If not, do not
   implement it.
2. Does Layo already have this behavior, helper, schema field, route, command,
   test utility, or UI pattern? Reuse it.
3. Does the platform, browser, DOM, CSS, Rust stdlib, TypeScript runtime, or an
   already-installed dependency solve it cleanly? Use that.
4. Can the behavior be represented in the existing document model, layout
   solver, command system, MCP schema, or Inspector pattern? Extend the existing
   surface instead of introducing a parallel one.
5. If new code is still required, implement the smallest maintainable slice that
   closes the tested gap.

## Non-Negotiables

Do not shrink a change by removing:

- document validation or migration handling
- accessibility states or keyboard paths
- security, authorization, or data-loss safeguards
- undo/redo behavior
- focused regression tests
- Playwright CLI proof for browser-visible editor behavior
- Penpot benchmark documentation when the work is part of product maturity

## PR Evidence

For meaningful product changes, the PR body should name the ladder decision:

- what existing primitive was reused,
- what new code was unavoidable,
- which verification proves the smaller implementation still behaves like the
  product needs.
