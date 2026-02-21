# PR: Split Tunneling

## Summary
Adds split tunneling to allow specific IPs/CIDRs to bypass the VPN tunnel.

## Platform Implementations
- **Linux**: `iptables` fwmark + `ip rule` policy routing
- **macOS**: `route add/delete` commands
- **Windows**: `route add/delete` commands

## Files Changed
- `src-tauri/src/split_tunnel.rs` — Cross-platform split tunnel manager
- `src-tauri/src/main.rs` — New Tauri commands

## Tauri Commands
- `get_split_tunnel_state` — Get current state
- `set_split_tunnel_config(enabled, bypass_ips, bypass_apps)` — Configure split tunnel
- `disable_split_tunnel` — Disable and remove rules

## Testing
1. Connect to VPN
2. `set_split_tunnel_config(true, ["192.168.1.0/24"], [])` — bypass local network
3. Verify: traffic to 192.168.1.x goes direct, all other traffic through VPN
4. `disable_split_tunnel` — verify all traffic goes through VPN
5. Unit tests: `cargo test --lib split_tunnel`
