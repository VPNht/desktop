# Build/CI Report: VPNht Desktop

## Overview
This report documents the CI/CD setup for the VPNht Desktop app (Tauri). The goal is to ensure reliable builds and releases for macOS, Windows, and Linux (x86_64 and ARM64).

---

## CI Workflows
### 1. `build.yml`
- **Triggers**: Pushes to `vpnht-rewrite`, tags (`v*`), and PRs to `vpnht-rewrite`.
- **Matrix Builds**:
  - **x86_64**: Linux (Ubuntu 22.04), macOS, Windows.
  - **ARM64**: macOS (`aarch64-apple-darwin`), Linux (`aarch64-unknown-linux-gnu`).
- **Caching**:
  - **Rust**: `Swatinem/rust-cache@v2` (per-platform).
  - **pnpm**: `actions/cache@v4` (per-OS, based on `pnpm-lock.yaml`).
- **Artifacts**: Uploaded for all platforms (`.deb`, `.AppImage`, `.rpm`, `.app`, `.dmg`, `.msi`, `.exe`).
- **Signing**: Uses `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secrets.

### 2. `release.yml`
- **Triggers**: Tag pushes (`v*`) and manual dispatch.
- **Matrix Builds**: All platforms (x86_64 and ARM64 for Linux/macOS, x86_64 for Windows).
- **Signing**:
  - **macOS**: Certificates, keychain setup, and notarization.
  - **Windows**: Authenticode signing.
  - **Linux**: GPG signing for `.deb` and `.rpm` packages.
- **Artifacts**: Uploaded to GitHub Releases.
- **Release Notes**: Auto-generated with installation instructions.
- **Updater JSON**: Generated for Tauri's updater.

---

## Required Secrets
| Secret | Description |
|--------|-------------|
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri private key for signing binaries. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the Tauri private key. |
| `MACOS_CERTIFICATE` | Base64-encoded macOS signing certificate. |
| `MACOS_CERTIFICATE_PASSWORD` | Password for the macOS certificate. |
| `MACOS_KEYCHAIN_PASSWORD` | Password for the macOS keychain. |
| `MACOS_SIGNING_IDENTITY` | macOS signing identity (e.g., `Developer ID Application: VPNht`). |
| `APPLE_ID` | Apple ID for notarization. |
| `APPLE_PASSWORD` | App-specific password for Apple ID. |
| `APPLE_TEAM_ID` | Apple Team ID. |
| `WINDOWS_CERTIFICATE` | Base64-encoded Windows Authenticode certificate. |
| `WINDOWS_CERTIFICATE_PASSWORD` | Password for the Windows certificate. |
| `GPG_PRIVATE_KEY` | GPG private key for signing Linux packages. |
| `GPG_PASSPHRASE` | Passphrase for the GPG private key. |

---

## Local Build Commands
### 1. Install Dependencies
```bash
pnpm install
```

### 2. Build Tauri App
```bash
pnpm tauri build --verbose
```

### 3. Development Mode
```bash
pnpm tauri dev
```

---

## Validation
- **CI**: GitHub Actions will automatically build and test the app on every push/PR.
- **Artifacts**: All builds are uploaded as artifacts for download.
- **Releases**: Tag pushes trigger a full release workflow, including signing and notarization.

---

## Notes
- The project uses `pnpm` for package management. Ensure `pnpm-lock.yaml` is up-to-date.
- Tauri signing keys and platform-specific certificates are required for production builds.