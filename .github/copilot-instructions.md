# Copilot Instructions

## Project Snapshot
- This repo is a single-file Deno CLI (`main.ts`) that converts HTML clipboard contents of `<img>` tags into a grouped comparison table.
- macOS packaging lives under `app/ScreenshotTable.app`; `deno compile` drops the binary in `app/ScreenshotTable.app/script` for a double-clickable app.
- There are no external services; functionality hinges on local shell utilities (`pbpaste`, `pbcopy`, `osascript`).

## Clipboard ➜ Table Flow (`main.ts`)
- `convertClipboard()` is the entry point: show notification → read clipboard HTML → parse images → group → generate table → write back to clipboard → surface results.
- `parseFilename()` extracts ordering, feature numbers, and timing (`before|after|standalone`) from image `alt` text. Keep its regex semantics in sync with tests.
- `parseImages()` walks `<img>` tags, normalizes `alt` text via `parseFilename()`, and sorts by the numeric prefix. Maintain strict attribute parsing; missing `alt` or `src` should skip entries.
- `groupImagesByCategory()` splits standalone images vs before/after pairs. The `order` field controls rendering order—preserve or update this when changing grouping logic.
- `generateTable()` renders HTML rows: standalone images first (two per row), then category sections with Before/After columns. Width is hard-coded to `400`—coordinate changes here with downstream consumers.

## macOS Integration
- `isRunningFromApp()` toggles behavior: CLI logs when run via `deno run`, dialogs/notifications when launched as the bundled app.
- Dialogs and notifications call `osascript`; failure should bail early with `showDialog(..., type='error')`. Test helpers stub these by running in CLI mode.
- Clipboard operations shell out to `pbpaste`/`pbcopy`; any new features must respect `--allow-run` permissions.

## Tasks & Workflows (`deno.json`)
- `deno task start` → quick CLI run (no `--watch`).
- `deno task dev` → watch mode with same permissions; useful while tweaking parsing/formatting.
- `deno task build` → produce CLI binary in `dist/screenshot-table`.
- `deno task build:app` → compile then copy binary into the `.app` bundle. Run this before distributing the macOS app.

## Testing Expectations (`main_test.ts`)
- Tests duplicate core helpers (`parseFilename`, `parseImages`, `formatCategoryTitle`) because `main.ts` does not export them. Update the copies when logic changes to keep coverage honest.
- Use `deno test main_test.ts` for the suite; no other tests exist. Prefer extending this file when adding new parsing scenarios.

## Coding Conventions
- TypeScript targeting Deno; no npm dependencies. Stick with standard library imports via `jsr:@std/...`.
- Keep async shell interactions wrapped with `Deno.Command`; provide friendly logs for CLI mode.
- Preserve minimal logging; informative emoji outputs (`✅/❌`) are intentional for CLI UX.
- When adding new functionality, favor pure helpers callable from tests, then invoke them from `convertClipboard()` to maintain coverage.

## When Modifying
- Changes affecting ordering, grouping, or HTML structure demand updates to both helper logic and tests.
- If you expand macOS behavior (new dialogs/notifications), ensure app mode vs CLI mode parity and adjust permissions/tasks when needed.
- Document any new commands or workflow steps in `README.md` so packaging instructions stay aligned.

## Common Gotchas
- Do not run `deno run` to test your changes; use `deno test` instead
- Do not create demo or example files after making changes
