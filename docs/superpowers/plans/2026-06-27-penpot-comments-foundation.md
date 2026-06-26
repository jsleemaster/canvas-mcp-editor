# Penpot Comments Foundation

**Goal:** Add the first product-level comments slice for selected Layo canvas objects, backed by saved data, HTTP, MCP, and visible Inspector UI.

## Penpot Reference

- Source: https://help.penpot.app/user-guide/designing/workspace-basics/#comments
- Penpot capability: comment tool, viewport comments, threaded replies, read/unread handling, edit/remove, and dashboard notifications.
- Layo decision: adapt. This slice stores selected-object comment threads with resolve state and agent-readable APIs. Viewport bubbles, replies, mentions, unread notifications, dashboard surfacing, and prototype comments remain follow-up team-product gaps.

## Maturity Mapping

- Gate: Team workflow.
- Current gap: `docs/product/penpot-maturity-benchmark.md` lists comments and review workflows as immature.
- Product proof required: comment state cannot live only in React. It must be stored beside the file, accessible through HTTP/MCP, and visible in the editor when a layer is selected.

## Minimal-Change Ladder

1. The behavior is required because team feedback/comments are a named Penpot-comparable gate.
2. Layo does not already have comments, but it has sidecar file-version storage, Fastify file routes, MCP file tools, document API helpers, Inspector sections, and Playwright editor tests.
3. No new dependency is needed.
4. Represent comments as document-adjacent sidecar data under `.layo/comments/<fileId>.json`, not inside `DesignFile`, so design JSON stays stable and version snapshots remain focused on canvas content.
5. Implement the smallest durable slice: create/list/resolve selected-node threads with `nodeId`, `nodeName`, body, author, timestamps, and active/resolved filtering.

## RED Tests

- `apps/server/src/storage.test.ts`: selected-node comment threads are stored beside the design file and resolve without mutating `DesignFile`.
- `apps/server/src/http.test.ts`: `/files/:fileId/comments` create/list/resolve routes expose the same behavior.
- `apps/server/src/mcp.test.ts`: MCP tools create, list, and resolve selected-node comments.
- `apps/web/src/document-api.test.ts`: web API helpers call the correct comment routes.
- `apps/web/e2e/editor-mvp.spec.ts`: selecting a layer shows the comment panel, creates a thread, persists it through HTTP, and resolves it from the Inspector.

## Verification Plan

Focused:

- `pnpm --filter @layo/server test -- src/storage.test.ts -t "comment threads"`
- `pnpm --filter @layo/server test -- src/http.test.ts src/mcp.test.ts -t "comment"`
- `pnpm --filter @layo/web test -- src/document-api.test.ts -t "comment"`
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts --grep "comments panel creates and resolves" --workers=1 --reporter=line`
- `pnpm --filter @layo/web typecheck`
- `pnpm --filter @layo/server typecheck`
- `pnpm --filter @layo/web build`
- `pnpm run check:penpot-maturity`
- `git diff --check`

Broad before PR:

- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`

## Remaining Gaps After This Slice

- Viewport comment bubbles and comment tool shortcut.
- Replies, mentions, edit/remove, read/unread notifications.
- Live Yjs comment updates and presence around review.
- Dashboard-level comment notification summaries.
