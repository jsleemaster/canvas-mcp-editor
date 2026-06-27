# Penpot Token Theme Management Design

## Reference

- Penpot Design Tokens: https://help.penpot.app/user-guide/design-systems/design-tokens/
- Reference capability: token themes are user-managed design-system objects. A theme has a name, group, and selected token sets; designers can create, edit, enable, disable, and delete themes.

## Decision

Layo will adopt theme management as document-local design-system behavior. The previous baseline made imported themes activatable; this slice adds first-class create/update/delete semantics so a user or agent can manage themes without rewriting raw DTCG JSON.

## Data Contract

Reuse `DesignTokenTheme`:

- `id`: stable id.
- `name`: visible name.
- `group`: optional group such as `mode`, `brand`, or `platform`.
- `enabled`: active state.
- `token_set_ids`: ordered token set ids included by the theme.

Add agent/editor commands:

- `upsert_token_theme`: create or update a theme by id, preserving group exclusivity when the saved theme is enabled.
- `delete_token_theme`: remove a theme by id.
- `set_document_token_themes`: web undo/redo snapshot command.

## Validation

- Theme ids and names must be non-empty.
- Theme token-set references must exist.
- Creating a duplicate id through the agent command updates the existing theme instead of appending another entry.
- Deleting a missing theme is an error on the server command surface and a no-op in local editor state.

## Product Surface

- Server agent and MCP `apply_agent_commands` support `upsert_token_theme` and `delete_token_theme`.
- Web editor state supports undo/redo-safe create, edit, and delete.
- Right Inspector token section lists editable theme rows with name, group, enabled state, token-set membership checkboxes, and delete controls.
- UI remains Korean-first and compact inside the existing Inspector token section.

## Scope Boundaries

This slice does not build a full modal, drag-reorder theme matrix, cross-file library sync, or hosted registry. It closes the document-local management gap so later slices can add richer visual theme matrix and library governance.

## Verification

- RED/GREEN server tests for agent create/update/delete and validation.
- RED/GREEN web reducer tests for undo/redo-safe theme management and rematerialization.
- Playwright CLI test for creating a theme from the Inspector, adding token sets, enabling it, seeing a bound fill update, and deleting it.
- Penpot benchmark and plan status updated with remaining theme matrix/library-sync gaps.
