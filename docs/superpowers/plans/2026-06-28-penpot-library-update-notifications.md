# Penpot Library Update Notifications

**Goal:** Close the next Penpot design-system maturity gap by letting files that imported a shared library registry item see and apply later registry updates without duplicating existing components.

**Architecture:** Keep the current server-local registry model. Add a persisted `libraries/subscriptions.json` sidecar that records each importing file, imported registry timestamp, id prefix, and original-to-local component/token id maps. A later publish with the same `libraryId` becomes an update notification for subscribed files. Applying the update reuses existing id maps, assigns ids only for new library members, rewrites existing imported components/tokens in place, and clears the notification by advancing the subscription timestamp.

## RED

- Added storage coverage for importing `team-kit`, republishing it with a new component, listing a pending update, applying it, and proving target components are `team-component-card` plus `team-component-badge` without duplication.
- Observed failure: `storage.listLibraryRegistryUpdates is not a function`.
- After partial implementation, observed failure: `nextIsoTimestamp is not defined`.
- Added HTTP coverage for `GET /files/:fileId/libraries/subscriptions`, `GET /files/:fileId/libraries/updates`, and `POST /files/:fileId/import/library/registry/update`; observed the expected 404 for the missing route.
- Added MCP coverage for read/write annotations and callTool update flow; observed the expected missing tool failures.
- Added web API coverage for the new helper functions; observed the expected missing wrapper failure.

## GREEN

- Added `LibraryRegistrySubscription` and `LibraryRegistryUpdateNotification` storage contracts.
- Persisted registry subscriptions in `libraries/subscriptions.json`.
- Made registry publishes monotonic per library id so same-tick republish produces a newer `updatedAt`.
- Added storage, HTTP, MCP, and web API update surfaces.
- Added file-panel UI that shows `업데이트 가능` rows and applies updates from the existing 게시 라이브러리 panel.
- Added quiet polling of current-file library update notifications so a source library republish appears while the target file remains open.
- Extended the Playwright CLI registry flow to publish a library, import it into another project, republish the source with a new component, see the target update notification, apply it, and verify both imported components exist exactly once.

## Verification

```bash
pnpm --filter @layo/server exec vitest run src/storage.test.ts -t "library registry subscriptions"
pnpm --filter @layo/server exec vitest run src/http.test.ts -t "registry library updates"
pnpm --filter @layo/server exec vitest run src/mcp.test.ts -t "registry library updates|annotations"
pnpm --filter @layo/web exec vitest run src/document-api.test.ts -t "registry libraries"
pnpm --filter @layo/web typecheck
node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts -g "shared library registry" --workers=1 --reporter=line
pnpm run check:penpot-maturity
pnpm run check:design-rules
pnpm typecheck
pnpm --filter @layo/web build
cargo test -p editor-core
pnpm test
pnpm test:e2e
git diff --check
```

All checks above passed on 2026-06-28. `pnpm test:e2e` passed with 142
Playwright CLI tests.

## Remaining Gaps

- Theme subscription/update notifications are still separate from library registry updates.
- The registry is still server-local; hosted permissioned registry sync remains a product maturity gap.
- Cross-process update fanout is polling-based in the browser and not yet backed by a durable pub/sub channel.
