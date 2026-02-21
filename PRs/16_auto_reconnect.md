# PR: Auto-reconnect

## Summary
Adds automatic VPN reconnection with exponential backoff when an unexpected disconnect is detected.

## Files Changed
- `src-tauri/src/vpn/mod.rs` — VPN module
- `src-tauri/src/vpn/auto_reconnect.rs` — Auto-reconnect manager with exponential backoff
- `src-tauri/src/main.rs` — New Tauri commands

## How It Works
1. When VPN connects, auto-reconnect enters **Monitoring** state
2. On unexpected disconnect, starts reconnection with configurable exponential backoff
3. Default: 1s initial delay, 2x backoff, 60s max delay, 10 max attempts
4. User-initiated disconnects are ignored (no auto-reconnect)
5. Cancellable at any time

## Tauri Commands
- `get_reconnect_state` — Get current reconnect state
- `set_auto_reconnect(enabled)` — Enable/disable auto-reconnect
- `cancel_reconnect` — Cancel ongoing reconnection

## Testing
1. Connect to VPN, verify auto-reconnect shows "Monitoring"
2. Simulate disconnect (kill WireGuard interface), verify reconnection attempts
3. Disable auto-reconnect, disconnect — verify no reconnection
4. Unit tests: `cargo test --lib vpn::auto_reconnect`
