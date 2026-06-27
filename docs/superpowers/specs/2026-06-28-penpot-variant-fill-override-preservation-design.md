# Penpot Variant Fill Override Preservation Design

Date: 2026-06-28

## Goal

Layo component instances should preserve compatible manual fill overrides when switching variants. A user who changes a nested instance layer fill should not lose that customization when selecting another variant whose source tree still contains the same source node id.

This closes the next narrow Penpot maturity gap after variant source-tree materialization: variant switching can change structure and style while retaining compatible instance-level visual edits.

## Current Failure

- `component_instance.overrides` already stores generic `{ node_id, field, value }` records.
- `update_text` records text overrides and materialization reapplies `field: "text"`.
- `set_fill` and server `setNodeFill` change the instance node style but do not record an override.
- When switching variants, the materialized target source tree overwrites the customized fill with the target variant source fill.

## Target Behavior

- Manual fill changes on a component-instance root or descendant compare against the active variant source node.
- If the fill differs from the active source node, store `{ node_id: <source-node-id>, field: "fill", value: <fill> }`.
- If the fill returns to the source value, remove that fill override.
- Variant materialization reapplies compatible fill overrides after cloning the target source tree.
- Overrides whose source target is not present in the target variant remain in metadata but are not applied.

## Non-Goals

- Stroke, stroke width, opacity, geometry, layout, token binding, and style binding override preservation are separate future slices.
- Full Penpot variant-area layout editing is not part of this slice.
- Hosted library publication or registry sync is not part of this slice.

## Verification

- Web reducer RED/GREEN: changing a nested component-instance fill, switching variants, and inspecting the materialized node keeps the custom fill.
- Server storage RED/GREEN: persisted `setNodeFill` followed by `setComponentInstanceVariant` keeps the custom fill and stores the fill override.
- Existing source-tree switching and text override behavior remains green.
