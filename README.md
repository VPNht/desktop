# VPNht Desktop

A modern, secure, cross-platform VPN client built with **Tauri**, **Rust**, and **React**. Features seamless WireGuard integration with encrypted configuration storage.

## Features

- 🔒 **WireGuard Protocol** - Fast, modern, and secure VPN protocol
- 🛡️ **Encrypted Configs** - AES-256-GCM encryption for stored configurations
- 💻 **Cross-Platform** - Native apps for Linux, macOS, and Windows
- ⚡ **Lightweight** - Built with Rust + Tauri for minimal resource usage
- 🎨 **Modern UI** - React + Tailwind CSS interface
- 📊 **Real-time Status** - Live connection monitoring and logging

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                   │
│              TypeScript + Tailwind CSS                  │
└────────────────────────┬────────────────────────────────┘
                         │ IPC (Tauri Commands)
┌────────────────────────▼────────────────────────────────┐
│                     Rust Backend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────┐  │
│  │ WireGuard   │  │ Crypto      │  │ Config Manager │  │
│  │ Manager     │  │ (AES-256)   │  │                │  │
│  └─────────────┘  └─────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Platform WireGuard CLI                    │
│         (wg-quick / WireGuard Service)                  │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

### Development

- **Rust** (1.70+) - Install via [rustup](https://rustup.rs/)
- **Node.js** (18+) - Install via [nodejs.org](https://nodejs.org/)
- **WireGuard** - Platform-specific installation required

### WireGuard Installation

**Linux:**
```bash
# Debian/Ubuntu
sudo apt install wireguard wireguard-tools

# Fedora
sudo dnf install wireguard-tools

# Arch
sudo pacman -S wireguard-tools
```

**macOS:**
```bash
brew install wireguard-tools
# Or download from App Store: WireGuard
```

**Windows:**
Download and install from: https://www.wireguard.com/install/

## Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/VPNht/desktop.git
cd desktop
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development mode:**
```bash
# Frontend + Rust backend with hot reload
npm run tauri:dev

# Or separately:
npm run dev          # Frontend only
npm run tauri:dev    # Full app
```

## Building

### Development Build
```bash
npm run tauri:dev
```

### Production Build
```bash
# All platforms (native to current OS)
npm run tauri:build

# Linux
npm run tauri:build:linux

# macOS  
npm run tauri:build:macos

# Windows
npm run tauri:build:windows
```

### Platform-Specific Requirements

**Linux:**
- `pkg-config`
- `libwebkit2gtk-4.0-dev` (or `libwebkit2gtk-4.1-dev`)
- `libssl-dev`
- `libappindicator3-dev`

**macOS:**
- Xcode Command Line Tools
- `cocoapods` (for iOS, not required for desktop)

**Windows:**
- Microsoft Visual Studio Build Tools
- Windows SDK

## Configuration

### WireGuard Config Format

Enter your WireGuard configuration in the app:

```ini
[Interface]
PrivateKey = YOUR_PRIVATE_KEY
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = SERVER_PUBLIC_KEY
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25
```

### Security

- **Encryption key**: Generated on first use or provide your own
- **Config storage**: `~/.config/vpnht/` (Linux), `~/Library/Application Support/vpnht/` (macOS), `%LOCALAPPDATA%\vpnht\` (Windows)
- **Root/Sudo access**: Required for WireGuard interface management

## Project Structure

```
desktop/
├── src/                    # React frontend
│   ├── App.tsx            # Main VPN UI
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind styles
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── main.rs        # Tauri app + commands
│   │   ├── wireguard.rs   # WireGuard integration
│   │   └── crypto.rs      # AES-256-GCM encryption
│   ├── icons/             # App icons
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## API Commands

The Rust backend exposes these commands:

| Command | Description |
|---------|-------------|
| `connect_vpn(config, config_name)` | Connect using WireGuard config |
| `disconnect_vpn()` | Disconnect active VPN |
| `get_vpn_status()` | Get current connection status |
| `save_config(name, data, key?)` | Save encrypted config |
| `load_config(name, key?)` | Load encrypted config |
| `list_configs()` | List saved configurations |
| `delete_config(name)` | Delete a configuration |
| `generate_encryption_key()` | Generate AES-256 key |

## Security Considerations

1. **Private Keys**: Never commit WireGuard private keys to Git
2. **Config Encryption**: Uses AES-256-GCM with argon2-derived keys
3. **Privileges**: VPN connection requires root/admin access (handled via pkexec/sudo/sc)
4. **CSP**: Strict Content Security Policy enabled in production
5. **DevTools**: Disabled in release builds

## Troubleshooting

**"Failed to copy config" on Linux**
- Ensure pkexec is available: `which pkexec`
- Or use sudo: Configure passwordless sudo for wg-quick

**"WireGuard not found" on Windows**
- Install WireGuard from: https://www.wireguard.com/install/
- Ensure `wireguard.exe` is in PATH

**Build failures**
```bash
# Clean and rebuild
rm -rf src-tauri/target node_modules dist
npm install
npm run tauri:build
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/feature-name`
3. Commit changes: `git commit -am 'feat: add new feature'`
4. Push to branch: `git push origin feat/feature-name`
5. Submit a Pull Request

## License

GPL-3.0 License - See [LICENSE](LICENSE) for details.

## Credits

- [Tauri](https://tauri.app/) - Rust-based app framework
- [WireGuard](https://www.wireguard.com/) - VPN protocol
- [React](https://react.dev/) - UI library
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/VPNht/desktop/issues
- Email: support@vpnht.com
