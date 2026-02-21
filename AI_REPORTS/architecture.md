# VPNht Architecture & Tech-Debt Review

## Overview
This report identifies high-risk tech debt in the **VPNht Tauri rewrite** and proposes targeted improvements.

---

## 🔍 Review Summary
### **State Management**
- **✅ Good**: Zustand + Immer for immutable state.
- **⚠️ Issues**: Race conditions, no state validation, latency map mutability.

### **IPC Boundaries**
- **✅ Good**: `Arc<Mutex<ConnectionManager>>` for thread safety.
- **⚠️ Issues**: No `Mutex` timeout, no input validation, mock data in production.

### **Configuration Management**
- **✅ Good**: WireGuard config generation and parsing.
- **⚠️ Issues**: Placeholder keys, hardcoded values, no runtime reloading.

### **Error Handling & Logging**
- **✅ Good**: Structured logging with `tracing`.
- **⚠️ Issues**: Errors converted to `String`, no sensitive data redaction.

### **Killswitch & Network Safety**
- **✅ Good**: Linux `iptables` rules.
- **⚠️ Issues**: No Windows/macOS support, no persistence, no DNS leak protection.

---

## 🚨 High-Risk Tech Debt
| Issue | Risk | Fix |
|-------|------|-----|
| **Race conditions in `useConnectionStore`** | Medium | Add `pending` flag to `connect`/`disconnect`. |
| **No `Mutex` timeout in IPC commands** | High | Use `tokio::time::timeout` for `Mutex` acquisition. |
| **Placeholder WireGuard keys** | Critical | Fail fast if `wg` tools are missing. |
| **No killswitch persistence** | High | Save state to disk and recover on startup. |
| **No input validation in IPC** | High | Validate `server_id` and other inputs. |
| **No error logging in frontend** | Medium | Add error boundaries and logging. |
| **No state validation on rehydration** | Medium | Validate persisted state (e.g., `user`, `tokens`). |
| **Latency measurement timeouts** | Medium | Add `tokio::time::timeout` for pings. |

---

## ✅ Production Hardening Checklist
### **1. State Management**
- [ ] Add `pending` flag to `useConnectionStore` to prevent race conditions.
- [ ] Validate persisted state on rehydration (e.g., `user`, `tokens`).
- [ ] Replace `Map` with plain object for `latencyMap` persistence.
- [ ] Add error logging in Zustand actions.

### **2. IPC Boundaries**
- [ ] Add `tokio::time::timeout` for `Mutex` acquisition in Tauri commands.
- [ ] Validate all IPC inputs (e.g., `server_id`, `email`).
- [ ] Replace mock data with real API calls (add `#[cfg(debug_assertions)]` for mocks).
- [ ] Add error boundaries in frontend for IPC errors.

### **3. Configuration Management**
- [ ] Fail fast if `wg` tools are missing or keys cannot be generated.
- [ ] Make DNS/MTU configurable via `SettingsStore`.
- [ ] Add runtime config reloading (e.g., Tauri events).
- [ ] Validate `WireGuardConfig` with `schemars` or `validator`.

### **4. Error Handling & Logging**
- [ ] Use `thiserror` or `anyhow` for structured errors.
- [ ] Add `RUST_LOG` env var support for log level filtering.
- [ ] Redact sensitive data in logs (e.g., tokens, IPs).
- [ ] Add error logging in frontend (e.g., Sentry).

### **5. Killswitch & Network Safety**
- [ ] Implement platform-specific killswitch logic (Windows: WFP, macOS: `pf`).
- [ ] Persist killswitch state to disk and recover on startup.
- [ ] Add DNS leak protection (block port 53).
- [ ] Implement VPN interface detection for Windows/macOS.

### **6. Build & CI/CD**
- [ ] Add `cargo clippy` and `cargo audit` to CI.
- [ ] Enforce `RUSTFLAGS="-D warnings"` in production builds.
- [ ] Add `tauri-bundler` for cross-platform packaging.
- [ ] Sign binaries for Windows/macOS.

---

## 🛠️ Top 2 Fixes Implemented
1. **Race Conditions in `useConnectionStore`**
   - Added `pending` flag to `connect`/`disconnect` to prevent overlapping calls.
2. **Placeholder WireGuard Keys**
   - Fail fast if `wg` tools are missing or keys cannot be generated.

---

## 📌 Recommendations
- **Short-Term**: Implement the **top 2 fixes** and address **high-risk issues**.
- **Long-Term**: Adopt **structured logging**, **error monitoring**, and **platform-specific killswitch** logic.
- **Testing**: Add **integration tests** for IPC commands and **fuzz testing** for config parsing.