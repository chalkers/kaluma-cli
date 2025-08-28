# Changelog

All notable changes to this project are documented here.

## [1.5.0] - 2025-08-28
- feat(flash): add `kaluma flash read <file>` to pull the current program from a connected Kaluma device using YMODEM. Does not overwrite existing files.
- feat(flash/read): add options `--stdout`, `--timestamp`, and `--quiet`.
- docs: update README usage (flash read), CLI help examples, and AGENTS.md (branching guidance).
- meta: align package.json license to `Apache-2.0` to match LICENSE/README.
- meta: add contributor Andrew Chalkley <andrew@chalkley.org> to package.json.
- feat(compat): support Node 20/22 by upgrading to `serialport@^12` and updating API usage.
- refactor(read): switch to size-first read (`.flash -s` then `.flash -r`) with CRLF normalization and ANSI stripping; remove internal YMODEM receive path.

## [1.4.0]
- Refer to git history for details prior to this release.
