# Penpot Team-Scoped Registry Plan

**Goal:** Close the next permissioned shared-library gap by scoping Layo's
server-local registry list/review/import flows to files that belong to the same
shared project team as the published library source.

**Penpot reference:** Penpot shared libraries are connected from files in the
same team, and Penpot team/project/file/library permissions vary by role. Layo
adapts that expectation to its local-first `ProjectManifest.sharing` model by
using the existing project team id as the registry visibility boundary.

**Maturity gates:** Design systems, import/export maturity, team workflow,
agent safety, and failure loop.

## Implementation

- Store an optional `teamId` on published registry entries by deriving it from
  the source file's project sharing state.
- Keep unscoped/private-source entries globally visible for compatibility with
  the existing local registry flow.
- Filter `listLibraryRegistry(fileId)` by the target file's project team ids.
- Reject review/import/update operations when a target file is outside the
  registry entry's team.
- Expose the same filter through HTTP, MCP, web API helpers, and the visible
  file-panel registry list.

## RED

- `pnpm --filter @layo/server exec vitest run src/storage.test.ts -t "scopes team-published"`
  failed before storage wrote `teamId` or enforced target access.
- `pnpm --filter @layo/server exec vitest run src/http.test.ts -t "scopes registry library HTTP"`
  failed because `GET /libraries?fileId=other-file` returned the other team's
  library.
- `pnpm --filter @layo/server exec vitest run src/mcp.test.ts -t "scopes registry library MCP"`
  failed because `list_library_registry` ignored the target `fileId`.
- `pnpm --filter @layo/web exec vitest run src/document-api.test.ts -t "passes target file id"`
  failed because `listLibraryRegistry("target-file", fetcher)` treated the
  file id as a fetcher.
- `node scripts/run-e2e.mjs -- apps/web/e2e/editor-mvp.spec.ts --grep "file panel scopes published registry" --reporter=line`
  failed because the file panel still showed `Team Kit` in a `team-beta`
  target project.

## GREEN

- Storage now persists `teamId`, filters lists by target file, and throws a
  403-style authorization error for cross-team registry review/import/update.
- HTTP `GET /libraries` accepts optional `fileId` and returns the scoped list.
- MCP `list_library_registry` accepts optional `fileId` and returns the scoped
  list while review/import tools reuse the storage guard.
- Web API helpers preserve the old `listLibraryRegistry(fetcher)` shape and add
  `listLibraryRegistry(fileId, fetcher)`.
- The file-panel registry refresh calls the scoped list for the current file,
  so other-team projects show an empty registry and same-team projects can
  review/import the library.

## Verification

- [x] RED/GREEN storage coverage for same-team visibility and cross-team
  rejection.
- [x] RED/GREEN HTTP coverage for scoped list and 403 review/import behavior.
- [x] RED/GREEN MCP coverage for scoped list and error-result import behavior.
- [x] RED/GREEN web API helper coverage for `?fileId=...`.
- [x] RED/GREEN Playwright CLI proof for visible file-panel scoping.
- [x] Focused registry regression suites.
- [x] Full repository gates:
  `pnpm run check:penpot-maturity`, `pnpm run check:design-rules`,
  `pnpm typecheck`, `pnpm --filter @layo/web build`,
  `cargo test -p editor-core`, `pnpm test`, `pnpm test:e2e`,
  and `git diff --check`.
- [x] PR merge and post-merge cleanup evidence.

## Merge And Cleanup Evidence

- PR #188, `https://github.com/jsleemaster/layo/pull/188`, was squash-merged
  into `main` as `8d5c608d540f9fd6eec25cc8bb10ddf73853c3ee`.
- Local `main` was fast-forwarded from `d3f9616` to `8d5c608`.
- The feature worktree at
  `/Users/leeo/jsleemaster/layo/.worktrees/penpot-team-scoped-registry` was
  removed.
- The local and remote `codex/penpot-team-scoped-registry` branches were
  deleted.
- Post-merge cleanup checks showed local `main`, a clean status, a single
  remaining repo worktree, and no remote head for the deleted feature branch.

## Remaining Gaps

- Hosted/multi-instance registry sync with durable auth instead of local
  project-manifest sharing only.
- Cross-process registry update fanout.
- Backup/restore runbooks and external migration paths.
- Arbitrary filter/effect graph fidelity.
