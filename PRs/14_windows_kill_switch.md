# PR: Windows Kill Switch (WFP)

## Summary
Adds a kill switch for Windows using Windows Filtering Platform (via `netsh advfirewall`).
When enabled, all non-VPN traffic is blocked. When disabled, normal networking is restored.

## Files Changed
- `src-tauri/src/killswitch/mod.rs` — Cross-platform kill switch trait and factory
- `src-tauri/src/killswitch/windows.rs` — Windows WFP implementation
- `src-tauri/src/main.rs` — New Tauri commands: `enable_killswitch`, `disable_killswitch`, `get_killswitch_state`

## How It Works
1. **Block all** outbound traffic via `netsh advfirewall firewall add rule`
2. **Allow** traffic to VPN server IP (tunnel establishment)
3. **Allow** traffic on VPN tunnel interface
4. **Allow** loopback and DHCP
5. On disable, all `VPNht_KillSwitch_*` rules are removed

## Testing (Manual - Windows only)
1. Build and run the app as Administrator
2. Connect to VPN
3. Call `enable_killswitch` with the VPN interface name and server IP
4. Verify: internet works through VPN only; disconnecting VPN blocks all traffic
5. Call `disable_killswitch` — normal networking resumes
6. Check `netsh advfirewall firewall show rule name=all | findstr VPNht` to verify rules are cleaned up
