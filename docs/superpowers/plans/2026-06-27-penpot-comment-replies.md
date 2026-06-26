# Penpot Comment Replies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development before changing production code. Keep Playwright CLI as the browser verification path.

**Goal:** Add Penpot-inspired replies to selected-node comment threads so a team can discuss a selected object without flattening every response into a new top-level comment.

**Reference:** Penpot comments let users open a comment bubble, read a thread, add replies, and later manage read/unread and dashboard notifications. Layo adopts the reply workflow now and defers mentions, unread state, notifications, and live comment sync.

**Architecture:** Extend the existing local-first comment sidecar. Keep `DesignFile` unchanged, store replies under `.layo/comments/<fileId>.json`, expose the behavior through storage, HTTP, MCP, web API helpers, and the right Inspector. Thread ordering remains newest-first; replies append in conversation order.

## Acceptance Criteria

- [x] New comment threads serialize with `replies: []`.
- [x] Existing sidecar threads without `replies` migrate to `replies: []` on read.
- [x] `FileStorage.addCommentReply` appends a reply with body, author, id, and timestamp.
- [x] Missing reply body fails with the existing comment validation error.
- [x] HTTP exposes `POST /files/:fileId/comments/:threadId/replies`.
- [x] MCP exposes `add_comment_reply`.
- [x] Web API exports `addCommentReply`.
- [x] The Inspector shows replies and lets the user add a reply to the selected-layer thread.
- [x] Playwright CLI proves create-thread, add-reply, UI rendering, and persisted API state.
- [x] Broad verification remains green.

## Test Plan

- [x] RED/GREEN `pnpm --filter @layo/server test -- src/storage.test.ts -t "comment"`.
- [x] RED/GREEN `pnpm --filter @layo/server test -- src/http.test.ts src/mcp.test.ts -t "comment"`.
- [x] RED/GREEN `pnpm --filter @layo/web test -- src/document-api.test.ts -t "comment"`.
- [x] RED/GREEN `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "comments panel adds replies to a selected-layer thread" --workers=1 --reporter=line`.
- [x] `pnpm --filter @layo/web typecheck`.
- [x] `pnpm --filter @layo/server typecheck`.
- [x] `pnpm run check:penpot-maturity`.
- [x] `pnpm run check:design-rules`.
- [x] `pnpm --filter @layo/web build`.
- [x] `git diff --check`.
- [x] `pnpm typecheck`.
- [x] `pnpm test`.
- [x] `pnpm test:e2e`.

## Remaining Gaps

- Mentions and assignee routing.
- Read/unread state and dashboard notifications.
- Live comment sync through the team relay.
- Comment edit/delete permissions.
- Full review, branch, merge, and visual diff workflows.
