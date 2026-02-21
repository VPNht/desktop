# PR #13: Network Monitoring

## Summary
Adds network monitoring utilities to detect connectivity status and VPN tunnel presence.

## Changes

### Backend (`src-tauri/`)
- **`src/network.rs`**: Network monitoring module.
  - `get_default_interface()`: Detects default network route via UDP socket.
  - `is_vpn_interface_active()`: Checks for `tun*`/`wg*` interfaces on Linux.
  - `check_network_status()`: Returns combined `NetworkStatus` (connected, vpn_active, default_ip).
  - `NetworkInterface` and `NetworkStatus` structs (serializable).

## Platform Support
- **Linux**: Full support (reads `/sys/class/net`).
- **Windows/macOS**: Placeholder with warning logs.

## Files Changed
- `src-tauri/src/network.rs` (new)
