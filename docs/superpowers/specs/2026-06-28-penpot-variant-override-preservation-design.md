# Penpot Variant Override Preservation Design

## Reference

- Source: https://help.penpot.app/user-guide/design-systems/variants/
- Penpot capability: component variants are grouped in a variant area, and
  swapping between variants should preserve compatible instance-level overrides
  on matching layers.

## Layo Decision

Layo will adapt the preservation part first. Existing component instances
already carry an `overrides` array, and code export already exposes it. The
missing behavior is that editing root or nested instance text does not record
an override, so switching variants cannot prove that the user's instance edit
is preserved.

## Scope

- Record text-content overrides when `update_text` targets the root text node
  of a component instance or a nested text node inside a component instance.
- Store the override against the source node id by removing the instance id
  prefix used by Layo's existing `renameInstanceTree` helper.
- Keep the actual nested instance text value unchanged when the instance variant
  changes.
- Preserve undo/redo behavior for both the text edit and variant switch.
- Do not add new document fields or commands.

## Out Of Scope

- Full visual variant area geometry.
- Switching the rendered instance subtree to a different source tree.
- Matching overrides by layer name/type when ids differ.
- Image, fill, typography, size, or nested structural overrides.
- Hosted library sync.

## Verification

- A web reducer test must fail before implementation because no override is
  recorded for nested instance text edits.
- The same test must pass after implementation and prove variant switching keeps
  the text value and override metadata intact.
- Browser-visible variant selector coverage should still pass.
