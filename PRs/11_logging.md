# PR #11: Structured Logging

## Summary
Adds structured logging with `tracing` + `tracing-subscriber`. Logs are JSON-formatted, rotated daily, and written to the app's log directory.

## Changes

### Backend (`src-tauri/`)
- **`src/logging.rs`**: Logging initialization.
  - JSON file output with daily rotation via `tracing-appender`.
  - Pretty stderr output for development.
  - Environment-based filter (`RUST_LOG` or default `info,vpnht=debug`).
  - Includes thread IDs, file/line numbers, and targets.
- **`src/main.rs`**: Calls `logging::init_logging()` on app setup (release builds only).

## Log Location
- Linux: `~/.local/share/com.vpnht.desktop/logs/vpnht.log`
- macOS: `~/Library/Logs/com.vpnht.desktop/vpnht.log`
- Windows: `%APPDATA%/com.vpnht.desktop/logs/vpnht.log`

## Files Changed
- `src-tauri/src/logging.rs` (new)
- `src-tauri/src/main.rs` (modified)
