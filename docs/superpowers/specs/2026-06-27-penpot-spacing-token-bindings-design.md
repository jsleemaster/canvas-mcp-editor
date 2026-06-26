# Penpot Spacing Token Bindings Design

## Context

Penpot design tokens include spacing and dimension values that can drive layout
decisions instead of living as disconnected numbers. Layo already supports
document-local color tokens, fill token bindings, and DTCG color import/export.
The next design-system maturity gap is making spacing tokens first-class enough
for saved layout semantics, human inspection, deterministic agent edits, and
code export.

## Design Decision

Extend the existing document-local `DesignToken` model instead of introducing a
parallel variable system.

- `DesignToken.type` supports `spacing`.
- DTCG `$type: "dimension"` and `$type: "spacing"` import as Layo spacing
  tokens.
- `NodeLayout.spacing_tokens` stores token references for gap, row gap, column
  gap, and four padding edges.
- Numeric layout values remain materialized on the node so the renderer and
  existing layout solvers stay deterministic.
- Manual Inspector edits clear the affected token binding, matching design-tool
  expectations that an override breaks the variable link for that field.

## MVP Behavior

- Agents can create spacing tokens and bind them to all gaps or all padding
  through `set_layout_spacing_token`.
- HTTP and MCP DTCG token import/export include spacing tokens.
- The right Inspector exposes spacing-token selects when spacing tokens exist.
- Code export emits CSS custom properties for spacing tokens and uses them for
  bound gap/padding declarations.
- Rust, server, renderer, and web contracts preserve spacing token references
  during JSON round trips and state normalization.

## Non-Goals

- No token sets, modes, aliases, expressions, or shared libraries in this slice.
- No typography token model.
- No per-side independent token picker beyond preserving per-side bindings.
- No Penpot file importer or shared-library synchronization.

## Acceptance Criteria

- DTCG spacing/dimension tokens round-trip through UI, HTTP, MCP, and storage.
- Agent commands can bind spacing tokens to layout gap and padding.
- Invalid or missing layout spacing token references fail validation.
- Inspector binding updates persisted layout numeric values and token refs.
- Code export includes spacing token CSS variables and implementation metadata.
- Playwright CLI verifies the visible Inspector flow against a live editor.
