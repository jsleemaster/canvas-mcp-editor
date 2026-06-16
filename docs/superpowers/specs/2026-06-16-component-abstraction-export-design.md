# Component Abstraction Export Design

## Context

`export_code` currently returns generated CSS, generated HTML, root element artifacts, and an index module. That proves code can be imported, but it is not enough for an agent to reimplement the design as real components. The agent still has to infer hierarchy, component boundaries, text props, instance links, and style semantics from HTML strings and raw document JSON.

## Direction

Extend the code export contract with a codegen-ready `implementationSpec`. The spec must be structured JSON, not another rendered string. It should describe each root element as a component candidate with a recursive node tree, layout/style fields, text content, component linkage, and implementation hints.

This keeps the existing HTML/CSS/module export stable while adding the abstraction layer needed for MCP-driven code implementation.

## Export Contract

`export_code` continues to return:

- `css`
- `html`
- `elements`
- `indexModule`

It also returns:

- `implementationSpec.elements[]`: one codegen-ready element spec per direct page child
- `implementationSpec.components[]`: one spec per `DesignFile.components[]` entry
- `implementationSpec.tokenCandidates`: color, font family, font size, and spacing candidates found in the exported design

Each element artifact also gets:

- `structure`: recursive node tree with geometry, style, text, component reference, and children
- `implementation`: suggested component name, props, slots, source node ids, and CSS classes

## Structure Rules

Root elements are direct page children. Child nodes remain nested under their root. Component definitions use their `source_node` as the structure root. Component instances expose `componentRef.definitionId`, `componentRef.detached`, and override metadata.

`implementation.suggestedProps` is intentionally conservative:

- text nodes create string prop candidates using a normalized node name
- component instances create a `component` reference but do not invent variant APIs
- non-text visual nodes do not get props unless their children require them

## Testing

Use TDD at the server exporter layer:

- RED test for element `structure` and `implementation`
- RED test for `implementationSpec.components[]` and component instance references
- RED test for HTTP export carrying the same structured spec

Then run server tests, typecheck, full repo tests, build, and Playwright CLI e2e.

## Non-Goals

- Generating React or Vue source files in this slice
- Full auto-layout inference
- Design-token naming beyond candidate extraction
- Pixel-perfect responsive layout generation
- Live component propagation semantics
