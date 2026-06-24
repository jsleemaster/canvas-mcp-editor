# Project Brief

Layo is an open-source, local-first design platform built for both human editing and AI-agent control.

The project exists to answer one product question: can a Penpot-class team design product expose its design document in a deterministic way so humans and AI agents can inspect the canvas, edit it, validate the result, collaborate, manage design systems, export component-ready code, and verify the rendered UI without relying on fragile screen-click automation?

## Product Scope

Layo targets Penpot-comparable team-product maturity while keeping its local-first and deterministic agent-control architecture. The current scope includes:

- A Rust-owned document model for pages, frames, rectangles, text nodes, components, geometry, and editor commands.
- A React browser editor for selection, canvas operations, inspector panels, component actions, and collaboration controls.
- A local Fastify server for file storage, HTTP APIs, MCP tools, agent command execution, and code export.
- A structured export format that separates root elements, component definitions, component instances, token candidates, implementation hints, HTML, and CSS.
- Optional real-time collaboration through a team-owned websocket relay.
- Optional encrypted document updates for relay teams.
- A product maturity loop that continuously compares Layo against Penpot and turns failed comparisons into the next implementation goal.

## Why MCP Matters Here

The MCP surface is the agent control plane. Agents should use it to:

- List and inspect design files.
- Read a compact design context.
- Find nodes by id, type, text, name, or component metadata.
- Apply deterministic edit commands.
- Validate document structure.
- Generate change summaries.
- Export design elements as code-ready structures.

The browser UI is still important, but primarily for human editing and visual verification. An agent should not need to infer the design from pixels first.

## Current Capabilities

- Canvas editor shell with node creation, selection, geometry changes, color/text edits, undo/redo, and viewport controls.
- Design tokens and UI rules enforced by repo scripts.
- Component definitions, instances, and detach behavior.
- HTTP and MCP agent-control endpoints.
- Code export with structured `implementationSpec`.
- Team manifests for collaboration setup and sharing.
- Remote cursor and remote selection display.
- Relay authorization with owner/editor/viewer roles.
- Passphrase-based encrypted collaboration snapshots.
- Static web deployment path with team-owned relay hosting.
- Experimental Rust relay for encrypted rooms.

## Maturity Benchmark

Penpot is the primary open-source benchmark for Layo's team-product maturity.
Before major editor, collaboration, design-system, import/export, developer
handoff, plugin, or deployment work, compare against
`docs/product/penpot-maturity-benchmark.md`. When the comparison exposes a
failure or missing behavior, feed it into `docs/process/penpot-maturity-loop.md`
and keep iterating on that failed case until there is product-level evidence.

## Runtime Model

Static web hosting and collaboration relay hosting are deliberately separate:

- `apps/web` can be built and shared as static files.
- Teams that need live collaboration run their own relay.
- The maintainers do not operate a default production relay.
- Team manifests configure relay URLs and metadata.
- E2EE protects document snapshots from the relay, but presence, cursor, selection, room ids, and auth metadata are visible to the relay in the current version.

## Agent Handoff Summary

When another AI enters this repo, tell it this:

> This is a local-first, Penpot-benchmarked design platform where Rust owns the design document model, React renders the editor, Fastify exposes HTTP and MCP tools, and collaboration is team-owned. The important feature is not only drawing UI; it is that humans and agents can inspect, edit, validate, collaborate, manage design systems, and export the canvas through structured APIs. Start with `AGENTS.md`, then `README.md`, then `docs/product/penpot-maturity-benchmark.md`, then the relevant plan/spec under `docs/superpowers`.

## Non-Goals For Now

- Copying Penpot or Figma feature-for-feature without checking Layo's local-first and deterministic agent-control architecture.
- A maintainer-operated production collaboration backend.
- Multi-tenant SaaS account infrastructure.
- Cloud-only document storage.
- Treating generated HTML/CSS strings as the only code-export contract.
