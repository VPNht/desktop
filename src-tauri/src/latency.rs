use std::net::TcpStream;
use std::time::{Duration, Instant};
use tracing::{debug, warn};

/// Measure real TCP latency to a server endpoint.
/// Performs a TCP connect to the given host:port and returns the round-trip time in ms.
pub fn measure_tcp_latency(host: &str, port: u16, timeout_ms: u64) -> Result<f64, String> {
    let addr = format!("{}:{}", host, port);
    let timeout = Duration::from_millis(timeout_ms);

    let start = Instant::now();
    match TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Invalid address {}: {}", addr, e))?,
        timeout,
    ) {
        Ok(_stream) => {
            let elapsed = start.elapsed().as_secs_f64() * 1000.0;
            debug!(host, port, latency_ms = elapsed, "TCP latency measured");
            Ok(elapsed)
        }
        Err(e) => {
            warn!(host, port, error = %e, "TCP latency measurement failed");
            Err(format!("Connection to {} failed: {}", addr, e))
        }
    }
}

/// Measure latency with multiple samples and return the median.
pub fn measure_latency_median(host: &str, port: u16, samples: usize) -> Result<f64, String> {
    let mut results = Vec::with_capacity(samples);

    for i in 0..samples {
        match measure_tcp_latency(host, port, 5000) {
            Ok(ms) => results.push(ms),
            Err(e) => {
                if i == 0 {
                    return Err(e); // Fail fast if first attempt fails
                }
                warn!("Sample {} failed: {}", i, e);
            }
        }
    }

    if results.is_empty() {
        return Err("All latency samples failed".to_string());
    }

    results.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let median = results[results.len() / 2];
    Ok(median)
}
