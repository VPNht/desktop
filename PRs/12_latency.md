# PR #12: Real Latency Measurement

## Summary
Replaces placeholder latency logic with real TCP-based latency measurement. Supports single-sample and median-of-N measurement modes.

## Changes

### Backend (`src-tauri/`)
- **`src/latency.rs`**: Real latency measurement.
  - `measure_tcp_latency()`: TCP connect timing to `host:port` with configurable timeout.
  - `measure_latency_median()`: Multiple samples with median calculation for accuracy.
  - Structured tracing for all measurements (success and failure).

## How It Works
1. Opens a TCP connection to the server's WireGuard port.
2. Measures the time from `connect()` to established connection.
3. For median mode, takes N samples and returns the middle value.

## Files Changed
- `src-tauri/src/latency.rs` (new)
