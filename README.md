# VPNht Desktop Client

A modern, secure VPN client built with Tauri + React + Rust. Phase 2 implementation featuring server selection, auth flow, WireGuard configuration, and interactive map UI.

## Features

### Core Features
- 🔐 **Secure Authentication** - Login/signup with secure token storage
- 🌍 **73 VPN Servers** - Global server network with latency testing
- 🗺️ **Interactive Map** - MapLibre-powered server map with click-to-connect
- ⚡ **WireGuard Support** - Fast, modern VPN protocol
- 🛡️ **Kill Switch** - Protect your connection
- 🔒 **DNS Leak Protection** - Prevent DNS leaks
- 🌙 **Dark Mode** - Beautiful dark UI

### Server Features
- Latency testing for all servers
- Favorite servers
- Search by region/city
- Sort by latency, name, or load
- P2P and streaming optimized servers

### Settings
- Auto-connect on launch
- Kill switch toggle
- DNS leak protection
- IPv6 blocking
- Custom DNS servers
- Protocol selection (WireGuard/OpenVPN)
- MTU configuration

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand
- **Backend**: Rust, Tauri 1.5
- **Maps**: MapLibre GL JS
- **State**: Zustand with Immer
- **Forms**: React Hook Form + Zod
- **i18n**: i18next + react-i18next

## Quick Start

### Prerequisites
- Node.js 18+
- Rust 1.70+
- npm or pnpm

### Development

```bash
# Clone the repository
git clone https://github.com/VPNht/desktop.git
cd desktop

# Install dependencies
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Platform-Specific Setup

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  wireguard \
  wireguard-tools
```

#### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Homebrew dependencies
brew install rust node
```

#### Windows
```powershell
# Install Chocolatey
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

choco install rust nodejs
```

### Running Tests

```bash
# Run frontend tests
npm test

# Run Rust tests
npm run tauri:test
```

## Project Structure

```
desktop/
├── src/                     # Frontend React code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── stores/             # Zustand stores
│   ├── styles/             # Tailwind CSS
│   ├── types/              # TypeScript types
│   ├── utils/              # Helper functions
│   ├── graphql/            # GraphQL operations
│   ├── App.tsx            # Main App component
│   ├── i18n.ts            # i18n configuration
│   └── main.tsx           # Entry point
├── src-tauri/              # Rust backend
│   └── src/
│       ├── main.rs         # Tauri entry point
│       ├── commands.rs     # Tauri commands
│       ├── error.rs        # Error types
│       ├── storage.rs      # Secure storage
│       ├── vpn.rs          # VPN management
│       └── config.rs       # WireGuard config
├── tests/                  # Test files
├── package.json
└── README.md
```

## Security

- Tokens stored securely using OS keyring/keychain
- No hardcoded credentials
- Encrypted configuration storage
- Kill switch implementation
- DNS leak protection

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=https://api.vpnht.com/graphql
VITE_WS_URL=wss://ws.vpnht.com
```

### WireGuard Configuration

WireGuard configs are generated dynamically from server data. The configuration format supports:
- Linux: `wg-quick` integration
- macOS: `wireguard-go` integration  
- Windows: WireGuard service integration

## API Integration

The app uses GraphQL for API communication:

- `GET_SERVERS` - Fetch server list
- `LOGIN`/`SIGNUP` - Authentication
- `GET_LATENCY` - Latency measurement
- `UPDATE_PREFERENCES` - Save user preferences

## Building for Production

### All Platforms
```bash
npm run tauri:build
```

### Specific Platform
```bash
# Windows
npm run tauri:build -- --target x86_64-pc-windows-msvc

# macOS
npm run tauri:build -- --target x86_64-apple-darwin

# Linux
npm run tauri:build -- --target x86_64-unknown-linux-gnu
```

## Troubleshooting

### WireGuard not connecting
- Ensure WireGuard tools are installed:
  - Linux: `sudo apt-get install wireguard wireguard-tools`
  - macOS: `brew install wireguard-tools`
  - Windows: Download from wireguard.com

### Build fails on Linux
- Install required dependencies (see Platform-Specific Setup)

### Map not loading
- Check network connectivity to MapLibre CDN
- Verify CSP settings in `tauri.conf.json`

## License

Copyright © 2024 VPNht. All rights reserved.

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- Documentation: https://docs.vpnht.com
- Support: support@vpnht.com
- Twitter: @VPNht
