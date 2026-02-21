# PR: macOS Kill Switch (pf)

## Summary
Adds a kill switch for macOS using pf (Packet Filter). Backs up existing rules, applies VPN-only rules, and restores on disable.

## Files Changed
- `src-tauri/src/killswitch/macos.rs` — macOS pf implementation

## How It Works
1. Backup current pf rules to `/tmp/vpnht_pf_backup.conf`
2. Write VPN-only rules: block all, allow loopback/DHCP/VPN server/VPN interface
3. Load rules via `pfctl -f` and enable pf
4. On disable, restore backed-up rules or system defaults (`/etc/pf.conf`)

## Testing (Manual - macOS only)
1. Build and run the app with `sudo` (pf requires root)
2. Connect to VPN
3. Call `enable_killswitch` with VPN interface and server IP
4. Verify: `sudo pfctl -sr` shows VPNht rules; internet works only through VPN
5. Call `disable_killswitch` — `pfctl -sr` shows original rules restored
