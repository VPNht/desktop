# PR #10: Kill Switch

## Summary
Implements a **Kill Switch** to block all non-VPN traffic when the VPN disconnects. Platform-specific implementations:
- **Linux**: `iptables` (DROP non-VPN traffic).
- **Windows**: Placeholder for WFP.
- **macOS**: Placeholder for `pf`.

## Changes

### Backend (`src-tauri/`)
- **`src/killswitch.rs`**: Core Kill Switch logic.
  - `enable()` / `disable()`: Manage firewall rules.
  - `on_vpn_disconnect()`: Block traffic on VPN drop.
- **`src/commands/killswitch.rs`**: IPC commands.
  - `enable_killswitch()` / `disable_killswitch()`.
- **`src/main.rs`**: Integrate Kill Switch into Tauri app.
  - Initialize Kill Switch on startup.
  - Register commands.

### Frontend (`src/`)
- **`src/utils/killswitch.ts`**: Frontend API.
  - `enableKillSwitch()` / `disableKillSwitch()`.
- **`src/pages/Settings.tsx`**: UI toggle.
  - Toggle in Connection settings.
  - Toast notifications for success/error.

## Testing

### Linux
1. Enable Kill Switch in UI.
2. Verify `iptables` rules:
   ```bash
   sudo iptables -L -n -v | grep vpnht
   ```
   **Expected**:
   ```
   DROP       all  --  *      *       0.0.0.0/0            0.0.0.0/0            mark match ! 0xca6c
   ```
3. Disable Kill Switch and verify rules are removed.

### Windows/macOS
- Placeholder implementations (log warnings).
- Ready for platform-specific PRs.

## Security Notes
- **Linux**: Requires `sudo` (handled by `iptables`).
- **Windows**: Uses Windows Filtering Platform (WFP).
- **macOS**: Uses Packet Filter (`pf`).

## Files Changed
- `src-tauri/src/killswitch.rs`
- `src-tauri/src/commands/killswitch.rs`
- `src-tauri/src/main.rs`
- `src/utils/killswitch.ts`
- `src/pages/Settings.tsx`