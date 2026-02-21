# PR: Connection Health Dashboard

## Summary
Adds real-time connection health monitoring with a UI dashboard widget showing latency, bandwidth, packet loss, and uptime.

## Files Changed
- `src-tauri/src/health.rs` — Health monitor (latency via ping, bandwidth via interface counters)
- `src-tauri/src/main.rs` — New Tauri command: `get_health_metrics`
- `src/App.tsx` — Health dashboard widget (auto-updates every 5s when connected)

## Metrics
- **Latency**: Ping RTT to VPN server (color-coded: green <50ms, yellow <150ms, red >150ms)
- **Download/Upload**: Bandwidth from interface counter deltas
- **Packet Loss**: 5-ping burst measurement
- **Totals**: Cumulative bytes transferred
- **Uptime**: Connection duration

## Testing
1. Connect to VPN
2. Health dashboard appears below "Connection Details"
3. Metrics update every 5 seconds
4. Disconnect — dashboard disappears
5. Unit tests: `cargo test --lib health`
