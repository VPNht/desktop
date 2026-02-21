# VPNht Desktop Client v1.0.0

<div align="center">

![VPNht Logo](assets/logo.svg)

**A modern, secure VPN client built with Tauri + React + Rust**

[![Build Status](https://github.com/VPNht/desktop/workflows/Build/badge.svg)](https://github.com/VPNht/desktop/actions)
[![Security Audit](https://img.shields.io/badge/security-audited-brightgreen.svg)](SECURITY_AUDIT.md)
[![License](https://img.shields.io/badge/license-Proprietary-blue.svg)](LICENSE)

[📥 Download](https://vpnht.com/download) • [📖 Docs](https://docs.vpnht.com) • [🐛 Bug Reports](https://github.com/VPNht/desktop/issues) • [💬 Discussions](https://github.com/VPNht/desktop/discussions)

</div>

## 📸 Screenshots

| Dark Mode | Light Mode | Server Map |
|-----------|------------|------------|
| ![Dark](screenshots/dark-home.png) | ![Light](screenshots/light-home.png) | ![Map](screenshots/map.png) |

## ✨ Features

### Core Features
- 🔐 **Secure Authentication** - Login/signup with secure token storage using OS keychain
- 🌍 **73 VPN Servers** - Global server network with real-time latency testing
- 🗺️ **Interactive Map** - MapLibre-powered server map with click-to-connect
- ⚡ **WireGuard Support** - Fast, modern VPN protocol with ChaCha20-Poly1305 encryption
- 🛡️ **Kill Switch** - Protect your connection if VPN drops
- 🔒 **DNS Leak Protection** - Prevent DNS leaks with custom DNS support
- 🌙 **Dark Mode** - Beautiful dark UI with system preference detection

### Production Features
- ✅ **Code Signed** - Signed binaries for Windows, macOS, and Linux
- ✅ **Auto Updates** - Automatic updates with signature verification
- ✅ **Multi-language** - 11 languages including RTL (Arabic, Hebrew)
- ✅ **Accessible** - WCAG 2.1 AA compliant with screen reader support
- ✅ **Cross-platform** - Native apps for Windows, macOS, and Linux

### Privacy Features
- 🚫 **No Logs Policy** - We don't track or log your activity
- 🔒 **Encrypted Storage** - OS-level secure storage for credentials
- 🕵️ **IP Leak Protection** - IPv6 blocking and comprehensive leak tests
- 🛡️ **Audit Verified** - Passed independent security audit

## 🚀 Quick Start

### Download

Download the latest release for your platform:

| Platform | Download | Requirements |
|----------|----------|--------------|
| macOS (Intel) | [DMG](https://github.com/VPNht/desktop/releases/latest/download/VPNht_x64.dmg) | macOS 10.15+ |
| macOS (Apple Silicon) | [DMG](https://github.com/VPNht/desktop/releases/latest/download/VPNht_aarch64.dmg) | macOS 11+ |
| Windows | [MSI](https://github.com/VPNht/desktop/releases/latest/download/VPNht_x64.msi) | Windows 10+ |
| Linux | [AppImage](https://github.com/VPNht/desktop/releases/latest/download/VPNht.AppImage) | Ubuntu 20.04+ |

### Development

```bash
# Clone the repository
git clone https://github.com/VPNht/desktop.git
cd desktop

# Install dependencies
npm install

# Run development server
npm run tauri:dev

# Build for production
npm run tauri:build
```

### Platform-Specific Setup

#### macOS
```bash
# Install dependencies
brew install wireguard-tools

# For code signing (maintainers only)
security import developer_id.cer
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
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

#### Windows
```powershell
# Install Visual Studio Build Tools with C++ workload
# WireGuard is bundled with the installer
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VPNht Desktop                          │
├─────────────────────┬───────────────────────────────────────┤
│    Frontend         │         Backend (Tauri/Rust)           │
│    (React + TS)     │                                        │
│ ┌───────────────┐   │   ┌──────────┐                        │
│ │  React UI     │   │   │ Commands │ ◄── IPC Channel        │
│ │  Components   │◄──┼───┤          │                        │
│ └───────────────┘   │   └──────────┘                        │
│                     │        │                              │
│ ┌───────────────┐   │   ┌────┴─────┐    ┌──────────────┐   │
│ │  State Mgmt   │   │   │ VPN Mgmt │◄──►│ WireGuard  │   │
│ │  (Zustand)    │   │   └──────────┘    └──────────────┘   │
│ └───────────────┘   │        │                              │
│                     │   ┌────┴─────┐    ┌──────────────┐   │
│ ┌───────────────┐   │   │ Storage  │◄──►│ OS Keychain  │   │
│ │  i18n         │   │   └──────────┘    └──────────────┘   │
│ │  (11 langs)   │   │                                      │
│ └───────────────┘   │   ┌──────────┐    ┌──────────────┐   │
│                     │   │ API      │◄──►│ GraphQL API  │   │
│                     │   └──────────┘    └──────────────┘   │
└─────────────────────┴───────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS |
| **State** | Zustand with Immer |
| **Forms** | React Hook Form + Zod |
| **Maps** | MapLibre GL JS |
| **i18n** | i18next + react-i18next |
| **Backend** | Rust, Tauri 1.5 |
| **VPN** | WireGuard (kernel module) |
| **Storage** | keyring-rs |
| **Build** | Vite, Tauri CLI |

## 🧪 Testing

```bash
# Frontend tests
npm test

# Rust tests
cd src-tauri && cargo test

# E2E tests
npm run test:e2e

# Linting
npm run lint
cd src-tauri && cargo clippy

# Security audit
cd src-tauri && cargo audit
npm audit
```

## 📝 Project Structure

```
desktop/
├── .github/
│   ├── workflows/          # CI/CD workflows
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   └── dependabot.yml      # Dependency updates
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand stores
│   ├── i18n/               # Internationalization
│   │   └── locales/        # Translation files (11 languages)
│   ├── utils/              # Utility functions
│   └── App.tsx             # App entry point
├── src-tauri/              # Rust backend
│   └── src/
│       ├── main.rs         # Tauri entry
│       ├── commands.rs     # IPC commands
│       ├── vpn.rs          # VPN management
│       ├── storage.rs      # Secure storage
│       └── config.rs       # Configuration
├── tests/                  # Test files
├── docs/                   # Documentation
└── README.md               # This file
```

## 🔒 Security

Security is our top priority. See our [Security Policy](SECURITY.md) and [Security Audit Report](SECURITY_AUDIT.md).

### Security Features
- ✅ Signed binaries (Windows: Authenticode, macOS: Developer ID, Linux: GPG)
- ✅ Automatic updates with Ed25519 signature verification
- ✅ Hardware-backed credential storage
- ✅ CSP protection against XSS
- ✅ Memory-safe Rust backend
- ✅ Regular dependency auditing (Dependabot + cargo-audit)

### Reporting Vulnerabilities

Please report security vulnerabilities to security@vpnht.com. See [SECURITY.md](SECURITY.md) for details.

## 🌐 Internationalization

Supported languages:

| Language | Code | Status |
|----------|------|--------|
| 🇺🇸 English | en | ✅ Complete |
| 🇫🇷 French | fr | ✅ Complete |
| 🇩🇪 German | de | ✅ Complete |
| 🇪🇸 Spanish | es | ✅ Complete |
| 🇵🇹 Portuguese | pt | ✅ Complete |
| 🇧🇬 Bulgarian | bg | ✅ Complete |
| 🇨🇳 Chinese | zh | ✅ Complete |
| 🇯🇵 Japanese | ja | ✅ Complete |
| 🇷🇺 Russian | ru | ✅ Complete |
| 🇸🇦 Arabic | ar | ✅ Complete (RTL) |
| 🇮🇱 Hebrew | he | ✅ Complete (RTL) |

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

### Quick Start

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

## 📊 CI/CD

Our GitHub Actions workflows:

- **Build** - Multi-platform builds on every push
- **Test** - Frontend (Vitest) and backend (Rust) tests
- **Security** - Automated security scanning
- **Release** - Signed releases with auto-updates

See [.github/workflows](.github/workflows) for details.

## 📄 License

Copyright © 2024 VPNht. All rights reserved.

This project is proprietary and confidential. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Framework for desktop apps
- [WireGuard](https://www.wireguard.com/) - Next-gen VPN protocol
- [MapLibre](https://maplibre.org/) - Open source mapping library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

<div align="center">
  
**[Website](https://vpnht.com)** • **[Support](mailto:support@vpnht.com)** • **[Twitter](https://twitter.com/VPNht)**

</div>