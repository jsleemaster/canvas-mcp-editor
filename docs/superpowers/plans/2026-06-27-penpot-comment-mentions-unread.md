# Penpot Comment Mentions And Unread State Plan

**Goal:** Move Layo's selected-node comments closer to Penpot-level team
commenting by persisting mentions and per-viewer read state across storage,
HTTP, MCP, web API helpers, and the Inspector.

**Penpot reference:** Penpot workspace comments support team discussion tied to
objects and workspace activity. Layo adapts that product direction to its
local-first sidecar comment store and deterministic HTTP/MCP surfaces.

## Product Contract

- Comment bodies and replies extract `@mention` tokens and persist them as
  stable `mentions` arrays.
- Comment threads store `readBy` viewer ids.
- `listCommentThreads` can compute `unread` for a supplied viewer without
  changing stored thread data.
- New threads are read by their author; replies reset `readBy` to the reply
  author so prior viewers see the thread as unread.
- HTTP and MCP expose read-state APIs.
- The Inspector shows mention chips, an unread badge, and a read action.

## TDD Evidence

- [x] RED storage test: `comment threads extract mentions and track unread readers per viewer`
- [x] GREEN storage implementation for `mentions`, `readBy`, `unread`, and
  `markCommentThreadRead`
- [x] RED/GREEN HTTP test for `viewerId` list query and `/read`
- [x] RED/GREEN MCP test for `viewerId` and `mark_comment_thread_read`
- [x] RED/GREEN web API helper test for `viewerId` and `markCommentThreadRead`
- [x] RED/GREEN Playwright CLI test for Inspector mention/unread/read UI

## Remaining Follow-Ups

- Live comment sync over team relay rooms.
- Dashboard/activity notification surface across projects and files.
- Mention targeting against real team members instead of display-name strings.
- Comment permissions and notification retention rules.
