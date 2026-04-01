# TODO

## v0.2

- [ ] Cap stdout/stderr capture in BinaryRunner with `.take(1MB)`
- [ ] Add depth and file count limits to `walk_source_files_inner()`
- [ ] Wire `--include-tests` CLI flag to source check filtering
- [ ] JsonOutputCheck: actually run `--output json` and validate output
- [ ] Add integration tests for `run()` orchestration and CLI flags
- [ ] Test behavioral check error paths (Crash, Timeout, NotFound)
- [ ] Eliminate `.unwrap()` from production code (dogfood code-unwrap)
- [ ] Make `--quiet` discoverable in `--help` output (dogfood P7)
