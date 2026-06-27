# Penpot Token Theme Matrix Design

## Reference

- Source: https://help.penpot.app/user-guide/design-systems/design-tokens/
- Penpot capability: token themes are grouped, and the possible group/set combinations are presented as a matrix so teams can understand which sets belong to which theme combination.

## Layo Decision

Layo will adapt this capability inside the existing right Inspector token section.
The document model already has token sets, grouped token themes, theme enabled
state, and ordered `token_set_ids`. The missing product behavior is a compact
visual matrix that lets a user scan and toggle theme-to-token-set membership
without opening every theme row.

## Scope

- Add a grouped token theme matrix above the existing detailed theme rows.
- Matrix rows are token themes grouped by `theme.group`.
- Matrix columns are document token sets in existing token-set order.
- Each included cell shows a checked checkbox and a small priority badge based
  on the theme's `token_set_ids` order.
- Toggling a cell reuses the existing `upsert_token_theme` flow, preserving
  undo/redo, persistence, active-token rematerialization, and MCP/HTTP semantics.
- Existing detailed theme rows, enable controls, row reorder controls, and
  per-theme token-set priority controls stay available.

## Out Of Scope

- New document fields.
- New server or MCP commands.
- Drag-to-reorder matrix columns.
- Hosted library/theme registry sync.
- Variant-area/source override preservation.

## Verification

- Playwright CLI e2e must fail before implementation because the matrix does
  not exist.
- The e2e must prove a matrix cell can add a token set to an active theme and
  rematerialize a bound fill from that newly included set.
- The full product maturity gates must still pass.
