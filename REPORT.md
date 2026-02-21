# VPNht Desktop — Production Readiness Audit Report

**Date**: 2026-02-21  
**Branch**: `audit/production-readiness-20260221`  
**Auditor**: Willy 🤖 (AI Agent Swarm)  
**Stack**: Tauri v1 + React 18 + TypeScript + Vite + Zustand + i18next + MapLibre GL

---

## Executive Summary

The VPNht Desktop app is a well-structured Tauri v1 desktop VPN client with a modern React frontend. However, it is **not production-ready** in its current state. All backend API calls are mock/placeholder, there are critical security gaps, minimal test coverage, broken build/lint/typecheck configurations, and the CI workflows target a stale branch. This audit fixed the immediate blockers and provides a roadmap to production.

---

## Phase 0 — Stack Identification

| Component | Technology |
|-----------|-----------|
| Framework | Tauri v1 (Rust backend + webview) |
| Frontend | React 18 + TypeScript + Vite |
| State | Zustand (with persist + immer middleware) |
| Styling | Tailwind CSS + tailwind-merge + clsx |
| i18n | i18next (11 languages) |
| Maps | MapLibre GL JS |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Secure Storage | keyring crate (OS keychain) |
| VPN Protocol | WireGuard (via system commands) |
| Package Manager | npm |

---

## Phase 2 — Baseline Verification Results

### Before Fixes

| Check | Status | Details |
|-------|--------|---------|
| `npm run typecheck` | ❌ FAIL | 3 errors in Map.tsx (raw `<` `>` in JSX), unused vars, union type issues |
| `npm run lint` | ❌ FAIL | No ESLint config file existed |
| `npm test` | ❌ FAIL | Import path wrong: `./helpers` → `../src/utils/helpers` |
| `npm run build` | ❌ FAIL | TypeScript errors + BigInt incompatible with safari13 target |
| `cargo check` | ❌ FAIL | Missing webkit2gtk-4.0 dev libs (Tauri v1 needs Ubuntu 22.04) |
| `npm audit` | ⚠️ | 20 vulnerabilities (4 moderate, 16 high) |

### After Fixes (This PR)

| Check | Status |
|-------|--------|
| `npm run typecheck` | ✅ PASS |
| `npm run lint` | ✅ PASS (0 errors, 8 warnings) |
| `npm test` | ✅ PASS (35 tests) |
| `npm run build` | ✅ PASS (1.47 MB bundle) |

---

## Security Findings

### Threat Model

**Assets**: User credentials, VPN private keys, auth tokens, DNS queries, connection state  
**Trust boundaries**: Frontend ↔ Rust IPC, App ↔ VPN daemon (system commands), App ↔ API server, App ↔ Update server  
**Attacker goals**: Credential theft, traffic interception, privilege escalation, DNS leaks, kill switch bypass

### Findings Table

| Severity | ID | Description | File | Fix Status |
|----------|-----|-------------|------|------------|
| **Critical** | SEC-01 | All API/auth is mock — no real authentication | `commands.rs:66-130` | ⚠️ Needs real API |
| **Critical** | SEC-02 | Mock tokens generated with `uuid::Uuid::new_v4()` — no crypto | `commands.rs:82-85` | ⚠️ Needs real API |
| **High** | SEC-03 | `store_secure`/`retrieve_secure` IPC exposes arbitrary keyring R/W | `commands.rs:297-315` | ⚠️ Needs allowlist |
| **High** | SEC-04 | Kill switch runs raw `iptables`/`pf` — needs root, no privilege check | `killswitch.rs:75-100` | ⚠️ Needs privilege escalation |
| **High** | SEC-05 | Auth tokens double-stored: keyring + localStorage (Zustand persist) | `stores/index.ts` | ⚠️ Remove localStorage persist for tokens |
| **High** | SEC-06 | `Result<T>` = `Result<T, String>` — AppError defined but unused | `error.rs` | ⚠️ Refactor needed |
| **Medium** | SEC-07 | 20 npm vulnerabilities (dev deps) | `package-lock.json` | ✅ Audit added to CI |
| **Medium** | SEC-08 | CSP allows `unsafe-inline` for styles | `tauri.conf.json` | ⚠️ Tighten CSP |
| **Medium** | SEC-09 | HTTP scope `*.vpnht.com` overly broad | `tauri.conf.json` | ⚠️ Restrict to specific endpoints |
| **Medium** | SEC-10 | No input validation on IPC command parameters | `commands.rs` | ⚠️ Add validation |
| **Low** | SEC-11 | `generateWireGuardKeypair()` returns placeholder strings | `helpers.ts:96-102` | ⚠️ Use Tauri crypto |
| **Info** | SEC-12 | Error messages include internal details ("Keyring error: ...") | `storage.rs` | ⚠️ Sanitize user-facing errors |

### Secure Defaults Checklist

- [ ] Replace all mock API calls with real authenticated endpoints
- [ ] Implement token refresh with secure rotation
- [ ] Restrict IPC `store_secure`/`retrieve_secure` to allowlisted keys
- [ ] Remove auth tokens from Zustand `persist` (localStorage)
- [ ] Add input validation to all IPC commands
- [ ] Tighten CSP — remove `unsafe-inline`
- [ ] Restrict HTTP scope to specific API endpoints
- [ ] Implement proper privilege escalation for kill switch
- [ ] Add certificate pinning for update channel
- [ ] Run `cargo audit` in CI

---

## Code Quality & Architecture

### Architecture Overview
Clean separation: Tauri commands in `src-tauri/src/commands.rs` handle IPC, `vpn.rs` manages connection lifecycle, `storage.rs` wraps OS keychain via `keyring` crate. Frontend uses Zustand stores (auth, connection, server, settings) with React Router for navigation. i18n supports 11 languages.

### Issues Found & Fixed
1. **Settings.tsx was a 14-line code fragment** — not a real component → Rewrote as full settings page
2. **Map.tsx had invalid JSX** — raw `<` and `>` characters → Escaped to `{"< 50ms"}`
3. **No ESLint config** → Created `.eslintrc.cjs` with React + TS rules
4. **Missing Vite env types** → Added `src/vite-env.d.ts`
5. **Build target too low** → Bumped `safari13` to `safari15` for BigInt (maplibre-gl)
6. **Unused imports throughout** → Cleaned up Layout, i18n, Servers, Home, stores

### Remaining Refactor Opportunities
- **P1**: Replace `Result<T, String>` with `Result<T, AppError>` across all Rust code
- **P1**: Split `commands.rs` (400+ lines) into domain-specific modules
- **P1**: Add React ErrorBoundary wrapping for each route
- **P2**: Code-split maplibre-gl (1.47 MB bundle, map is one route)
- **P2**: Add loading skeletons for async data fetching
- **P2**: Memoize expensive computations in server list (50+ servers)

---

## Testing

### Current State
- **Before**: 0 passing tests (1 broken test file)
- **After**: 35 passing tests across 2 test suites

### Tests Added
- `tests/utils/helpers.test.ts` — 30 tests covering:
  - `formatBytes`, `formatDuration`, `formatLatency`, `formatSpeed`
  - `validateEmail`, `validatePassword`
  - `groupByRegion`, `getCountryFlag`, `getCountryCodeFromName`
  - `debounce`, `cn`
- `tests/helpers.test.ts` — Fixed import path, 5 tests restored

### Test Pyramid (Recommended)
| Layer | Framework | Priority | Status |
|-------|-----------|----------|--------|
| Unit (TS utils) | Vitest | P0 | ✅ 35 tests |
| Unit (Rust) | cargo test | P0 | ⚠️ 2 existing tests |
| Component (React) | @testing-library/react | P1 | ❌ Not started |
| Integration (IPC) | Vitest + Tauri mock | P1 | ❌ Not started |
| E2E | Playwright | P2 | ❌ Not started |

### How to Run Tests
```bash
npm test                    # JS/TS unit tests (Vitest)
cd src-tauri && cargo test  # Rust unit tests
```

---

## CI/CD

### New Workflow: `.github/workflows/ci.yml`
| Job | Runs On | Purpose |
|-----|---------|---------|
| `lint-typecheck` | ubuntu-latest | ESLint + TypeScript `--noEmit` |
| `test` | ubuntu-latest | Vitest test suite |
| `build-frontend` | ubuntu-latest | Vite production build + artifact upload |
| `build-tauri` | ubuntu-22.04, windows-latest, macos-latest | Full Tauri builds with artifact upload |
| `security-audit` | ubuntu-latest | npm audit + cargo audit |
| `codeql` | ubuntu-latest | CodeQL JS/TS analysis |

**Features**: Rust caching (Swatinem/rust-cache), npm caching, concurrency control, artifact retention.

### Existing Workflows (Issues Found)
- `build.yml`, `test.yml`, `security.yml`, `release.yml` all target `vpnht-rewrite` branch — not `main`
- Build command `cd src-tauri && npm run tauri:build` is incorrect (`tauri:build` is in root `package.json`)
- CodeQL `rust` language may not be supported — our new CI uses JS/TS only

---

## UX & Feature Recommendations

### Quick Wins (< 1 day)
1. **Connection timer** — show elapsed time since VPN connected (data already in store)
2. **Server ping on hover** — measure latency on demand instead of bulk
3. **Keyboard shortcuts** — Ctrl/Cmd+K for quick connect, Escape to disconnect

### Feature Proposals
| # | Feature | Value | Effort |
|---|---------|-------|--------|
| 1 | Split tunneling | High — exclude apps/domains from VPN | L |
| 2 | Connection speed graph | Medium — real-time throughput visualization | M |
| 3 | Favorites/recent servers | High — quick access to preferred servers | S |
| 4 | Auto-connect on untrusted WiFi | High — security automation | M |
| 5 | Server load indicator | Medium — help users pick less loaded servers | S |
| 6 | Multi-hop / double VPN | Medium — privacy-conscious users | L |
| 7 | Custom DNS presets | Medium — easy ad-blocking / privacy DNS | S |
| 8 | Connection notifications | Low — system tray alerts on connect/disconnect | S |
| 9 | Speed test integration | Medium — verify VPN isn't throttling | M |
| 10 | Export/import settings | Low — backup configuration | S |

---

## Commit Log

| Hash | Message |
|------|---------|
| `190a9a9` | fix: resolve typecheck, lint, test, and build failures |
| `2b43a9c` | test: add comprehensive unit tests for utils/helpers |
| `8a6368b` | ci: add comprehensive CI/CD workflow |

---

## Prioritized Roadmap

### P0 — Must Fix Before Release
- [ ] Replace all mock API calls with real VPNht API integration
- [ ] Implement real authentication (not mock tokens)
- [ ] Restrict IPC `store_secure`/`retrieve_secure` to allowlisted keys
- [ ] Remove auth tokens from localStorage (Zustand persist)
- [ ] Add input validation to all IPC commands
- [ ] Implement proper privilege escalation for kill switch
- [ ] Fix existing CI workflows to target correct branch

### P1 — Should Fix
- [ ] Use `AppError` type instead of `String` for error handling
- [ ] Add React component tests (Login, Home, Settings)
- [ ] Code-split maplibre-gl to reduce bundle size
- [ ] Tighten CSP — remove `unsafe-inline`
- [ ] Restrict HTTP scope to specific endpoints
- [ ] Add Rust unit tests for commands, vpn, killswitch modules
- [ ] Add E2E test for critical login → connect flow

### P2 — Nice to Have
- [ ] Implement favorites/recent servers
- [ ] Add connection speed graph
- [ ] Custom DNS presets
- [ ] Split tunneling
- [ ] Export/import settings

---

## Remaining Risks

1. **No real API integration** — the entire backend is mock. This is the single biggest blocker to production.
2. **Kill switch untested on real systems** — the iptables/pf commands have never been validated in a real environment.
3. **No code signing** — Tauri builds won't be trusted on macOS/Windows without proper signing certificates.
4. **Updater not configured** — the auto-updater in tauri.conf.json needs a real update endpoint and signing key.
5. **Bundle size** — 1.47 MB JS bundle (maplibre-gl is the main contributor). Should code-split.

---

*This report was generated as part of the `audit/production-readiness-20260221` branch. All findings are based on direct code review, build verification, and automated analysis.*
