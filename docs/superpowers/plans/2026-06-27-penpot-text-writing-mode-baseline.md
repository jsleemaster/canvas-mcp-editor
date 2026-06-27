# Penpot Text Writing Mode Baseline

## Goal

Close the first Penpot-like vertical text maturity slice by making text writing mode a persisted document concept that affects baseline layout, appears in the right Inspector for selected text objects, and survives developer handoff through structure JSON and CSS export.

This slice does not claim complete vertical typography parity. Full visual vertical text rendering on the canvas, glyph orientation controls, text layout metrics, and deeper CSS baseline group semantics remain later layout/text maturity gaps.

## RED Evidence

- `pnpm --filter @layo/web test -- src/editor-state.test.ts --runInBand` failed because vertical writing-mode text still used horizontal font-size baseline math.
- `pnpm --filter @layo/server test -- src/code-export.test.ts --runInBand` failed because exported text structure omitted `writingMode`.
- `cargo test -p editor-core text_writing_mode_round_trips_through_json --test document_model` failed because `NodeContent::Text` had no `writing_mode` field.
- `pnpm --filter @layo/server test -- src/storage.test.ts --runInBand` failed because `set_text_writing_mode` did not persist through agent commands.
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "text inspector persists vertical writing mode into dev handoff" --workers=1 --reporter=line` failed after the dev server was running because `inspector-text-writing-mode` did not exist.

## Implementation

- Added `TextWritingMode` values: `horizontal_tb`, `vertical_rl`, and `vertical_lr`.
- Added optional `writing_mode` to renderer, server storage, Rust `NodeContent::Text`, and generated Rust TypeScript binding.
- Added web editor `set_text_writing_mode` command with undo/redo and relayout.
- Updated web and server baseline layout solvers so vertical writing-mode text uses half of the text box width as the baseline offset.
- Added server agent command support for `set_text_writing_mode` and optional `writingMode` on `create_text`.
- Added MCP `create_text` optional `writingMode`.
- Added right Inspector writing-mode select for selected text nodes.
- Added CSS `writing-mode` export and structure `writingMode` handoff for non-horizontal text.

## Verification

Focused GREEN:

- `pnpm --filter @layo/web test -- src/editor-state.test.ts --runInBand`
- `pnpm --filter @layo/server test -- src/code-export.test.ts --runInBand`
- `pnpm --filter @layo/server test -- src/storage.test.ts --runInBand`
- `cargo test -p editor-core text_writing_mode_round_trips_through_json --test document_model`
- `pnpm exec playwright test apps/web/e2e/editor-mvp.spec.ts -g "text inspector persists vertical writing mode into dev handoff" --workers=1 --reporter=line`

Broad GREEN:

- `pnpm run check:penpot-maturity`
- `pnpm run check:design-rules`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @layo/web build`
- `git diff --check`
- `pnpm test:e2e` with 122 passing tests

## Next Gap

Full visual vertical text rendering remains open. The next maturity slice should compare Penpot/CSS behavior for vertical text layout, glyph orientation, selection/edit overlays, and canvas rendering rather than stopping at metadata and handoff.
