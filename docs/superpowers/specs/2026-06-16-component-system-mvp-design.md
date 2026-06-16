# Component System MVP Design

## Context

The current editor can draw and edit nodes, but it does not have Figma-style components. Search confirms there is no `ComponentDefinition`, `ComponentInstance`, `variant`, or override model in the current implementation. This milestone adds the first real component data model and visible UI actions without attempting full Figma parity.

## Design Decision

Use a document-level component registry plus instance metadata on canvas nodes.

- `DesignFile.components[]` stores reusable component definitions.
- `ComponentDefinition.source_node` stores a canonical cloned node tree.
- `ComponentDefinition.variants[]` stores variant metadata for the first component set foundation.
- `NodeKind` gains `component` and `component_instance`.
- Instance root nodes store `component_instance.definition_id`, `overrides`, and `detached`.

This keeps the tree renderable by the current renderer while making component linkage explicit and serializable.

## MVP Behavior

- **Create Component** converts the selected node into a main component and stores a definition snapshot.
- **Create Instance** clones the selected component definition into the current page as a linked instance.
- **Detach Instance** removes the component linkage and changes the instance root into a normal frame-like node.
- Component and instance nodes still use the existing selection, drag, resize, fill, text, undo, and redo flows.
- HTTP and MCP expose list/create-instance/detach tools so agents can inspect and manipulate the component system.

## Non-Goals

- No live propagation from main component edits to all instances in this milestone.
- No visual variant picker beyond stored variant metadata.
- No nested override resolution engine.
- No component library package manager.

## Acceptance Criteria

- Rust model serializes component definitions and component instance metadata.
- Web editor state can create a component from a selected node, create an instance, and detach it.
- UI exposes Create Component, Create Instance, and Detach Instance controls.
- Server storage and HTTP routes support component actions.
- MCP exposes component tools.
- Playwright CLI directly verifies component creation, instancing, and detaching in the browser.
