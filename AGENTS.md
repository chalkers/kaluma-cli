# Repository Guidelines

## Project Structure & Module Organization
- `bin/kaluma.js`: CLI entry and command definitions.
- `lib/`: implementation for commands (`flash.js`, `erase.js`, `bundle.js`, `put.js`, `get.js`).
- `util/`: shared helpers (`ymodem.js`, `buffered-serial.js`, `eval.js`).
- `test/`: example Kaluma programs you can bundle/flash to a device.
- `.eslintrc.json`: code style (Airbnb base, 2‑space indent).

## Build, Test, and Development Commands
- Install deps: `npm install`
- Run CLI locally: `node bin/kaluma.js --help` or `npx kaluma`
- List ports: `node bin/kaluma.js ports`
- Bundle: `node bin/kaluma.js bundle test/index.js --minify`
- Flash + bundle + shell: `node bin/kaluma.js flash test/index.js -b -s`
- Lint: `npx eslint .`
- Tests: no unit test runner is configured (`npm test` is a placeholder). Use the samples under `test/` for manual verification with hardware.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; follow Airbnb style enforced by ESLint.
- Names: `camelCase` for variables/functions, hyphenated filenames in `util/` and small lowercase modules in `lib/`.
- Structure: keep CLI parsing and UX in `bin/kaluma.js`; place reusable logic in `lib/`; low‑level serial/IO utilities in `util/`.

## Testing Guidelines
- Framework: none configured. Prefer manual integration tests on real devices.
- Smoke tests: use `test/index.js` or `test/blink.js` with `flash -b -s` and observe console output.
- File transfer: validate `put`/`get` paths are absolute on device and compare sizes reported by CLI.
- Bundling: verify output name/size and source maps when `--sourcemap` is used.

## Commit & Pull Request Guidelines
- Branching: create a branch for new work. Use prefixes like `feat/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`. Example: `git checkout -b feat/flash-shell-mode`.
- Commits: imperative, concise messages; optional scope (e.g., `flash: handle shell mode`). Reference issues with `#123` when applicable.
- PRs: include a summary, repro steps, device/board and OS details, Node version, and console output/screenshots. Update README when flags/UX change.
- Quality: run `npx eslint .`, try `ports`, `bundle`, `flash`, `put`, `get` locally, and keep changes minimal and focused.

## Security & Configuration Tips
- Default port query uses Raspberry Pi VID `@2e8a`. Run `ports` before flashing to confirm the target device.
- Required Node: `>=16` (tested on 16/18/20/22). Avoid adding networked dependencies without discussion.
