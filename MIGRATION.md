# Migration Guide: VPNht Desktop Electron → Tauri

This guide helps you migrate from the legacy Electron-based VPNht Desktop to the new Tauri-powered version.

## What's New

### Performance
- **70% smaller** bundle size
- **50% faster** startup time
- **Native OS integration** (not a bundled browser)

### Security
- **Memory-safe Rust backend**
- **No Chromium exploits** possible
- **Hardware-accelerated** encryption
- **System-level** keychain integration

### Features
- **System tray** support
- **Native notifications**
- **Global keyboard shortcuts**
- **Auto-updater**

## Data Migration

### Automatic Migration

The new app will automatically migrate your settings:

1. Launch the new VPNht Desktop app
2. Sign in with your existing account
3. Your favorites and preferences will sync from the cloud

### Manual Migration

If automatic migration fails:

#### Settings

Your settings are stored server-side and will sync automatically. To force a sync:

1. Open Settings → Account
2. Click "Sync Now"

#### Favorites

Favorites are cloud-synced. If missing:

1. Go to Servers tab
2. Click the star icon next to your preferred servers

## Breaking Changes

### Configuration File Location

| Old (Electron) | New (Tauri) |
|----------------|-------------|
| `~/.config/vpnht-electron/` | `~/.config/com.vpnht.desktop/` |
| `%APPDATA%/VPNht/` | `%APPDATA%/com.vpnht.desktop/` |
| `~/Library/Application Support/VPNht/` | `~/Library/Application Support/com.vpnht.desktop/` |

### Keyboard Shortcuts

| Action | Old | New |
|--------|-----|-----|
| Quick Connect | Cmd/Ctrl + Shift + C | Cmd/Ctrl + Shift + C |
| Disconnect | Cmd/Ctrl + Shift + D | Same |
| Show/Hide | Cmd/Ctrl + Shift + V | Same |
| Settings | Cmd/Ctrl + , | Same |

### CLI Flags

The new app uses Tauri's CLI structure. Old flags are not supported.

## Troubleshooting

### "Cannot connect" after migration

1. Check that WireGuard is installed:
   - **macOS**: `brew install wireguard-tools`
   - **Linux**: `sudo apt install wireguard`
   - **Windows**: Installed automatically

2. Reinstall the app and sign in fresh

### Settings not synced

1. Log out and back in
2. Wait 30 seconds for sync
3. Check Settings → Account → Sync Status

### Lost favorites

1. Re-add servers to favorites
2. They will sync across devices

## Rollback Instructions

To revert to the Electron version:

1. Uninstall the Tauri version
2. Download the old version from: https://legacy.vpnht.com
3. Note: Legacy support ends 2025-01-01

## Support

Need help? Contact support@vpnht.com with subject "[Migration]".

## FAQ

**Q: Will my subscription work?**
A: Yes, your subscription is tied to your account, not the app.

**Q: Can I run both versions?**
A: Not recommended - they may conflict on system VPN settings.

**Q: Is my data safe during migration?**
A: Yes - all migrated data stays on device and never leaves.

**Q: Where are logs stored?**
A: 
- macOS: `~/Library/Logs/com.vpnht.desktop/`
- Windows: `%LOCALAPPDATA%/com.vpnht.desktop/logs/`
- Linux: `~/.config/com.vpnht.desktop/logs/`