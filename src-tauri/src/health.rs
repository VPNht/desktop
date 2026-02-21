//! Connection Health monitoring — real-time latency and bandwidth metrics.

use log::{error, info};
use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::{Duration, Instant};

/// Health metrics snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthMetrics {
    /// Round-trip latency to VPN server in milliseconds.
    pub latency_ms: Option<f64>,
    /// Estimated download bandwidth in bytes/sec (from last measurement).
    pub download_bps: Option<u64>,
    /// Estimated upload bandwidth in bytes/sec (from last measurement).
    pub upload_bps: Option<u64>,
    /// Packet loss percentage (0-100).
    pub packet_loss_pct: Option<f64>,
    /// VPN interface bytes received (cumulative).
    pub bytes_rx: Option<u64>,
    /// VPN interface bytes transmitted (cumulative).
    pub bytes_tx: Option<u64>,
    /// Connection uptime in seconds.
    pub uptime_secs: Option<u64>,
    /// Timestamp of this measurement (unix epoch seconds).
    pub timestamp: u64,
}

impl Default for HealthMetrics {
    fn default() -> Self {
        Self {
            latency_ms: None,
            download_bps: None,
            upload_bps: None,
            packet_loss_pct: None,
            bytes_rx: None,
            bytes_tx: None,
            uptime_secs: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
        }
    }
}

/// Health monitor that collects metrics.
pub struct HealthMonitor {
    vpn_server_ip: Option<String>,
    vpn_interface: Option<String>,
    connected_at: Option<Instant>,
    last_bytes_rx: u64,
    last_bytes_tx: u64,
    last_sample_time: Option<Instant>,
}

impl HealthMonitor {
    pub fn new() -> Self {
        Self {
            vpn_server_ip: None,
            vpn_interface: None,
            connected_at: None,
            last_bytes_rx: 0,
            last_bytes_tx: 0,
            last_sample_time: None,
        }
    }

    /// Called when VPN connects.
    pub fn on_connected(&mut self, vpn_interface: &str, vpn_server_ip: &str) {
        self.vpn_interface = Some(vpn_interface.to_string());
        self.vpn_server_ip = Some(vpn_server_ip.to_string());
        self.connected_at = Some(Instant::now());
        self.last_bytes_rx = 0;
        self.last_bytes_tx = 0;
        self.last_sample_time = None;
        info!("Health monitor: tracking {} (server: {})", vpn_interface, vpn_server_ip);
    }

    /// Called when VPN disconnects.
    pub fn on_disconnected(&mut self) {
        self.vpn_interface = None;
        self.vpn_server_ip = None;
        self.connected_at = None;
    }

    /// Collect current health metrics.
    pub fn collect(&mut self) -> HealthMetrics {
        let mut metrics = HealthMetrics::default();

        if let Some(ref connected_at) = self.connected_at {
            metrics.uptime_secs = Some(connected_at.elapsed().as_secs());
        }

        // Measure latency via ping
        if let Some(ref server_ip) = self.vpn_server_ip {
            metrics.latency_ms = self.measure_latency(server_ip);
            metrics.packet_loss_pct = self.measure_packet_loss(server_ip);
        }

        // Read interface counters
        if let Some(ref iface) = self.vpn_interface {
            if let Some((rx, tx)) = self.read_interface_counters(iface) {
                metrics.bytes_rx = Some(rx);
                metrics.bytes_tx = Some(tx);

                // Calculate bandwidth from delta
                if let Some(last_time) = self.last_sample_time {
                    let elapsed = last_time.elapsed().as_secs_f64();
                    if elapsed > 0.1 {
                        let rx_delta = rx.saturating_sub(self.last_bytes_rx);
                        let tx_delta = tx.saturating_sub(self.last_bytes_tx);
                        metrics.download_bps = Some((rx_delta as f64 / elapsed) as u64);
                        metrics.upload_bps = Some((tx_delta as f64 / elapsed) as u64);
                    }
                }

                self.last_bytes_rx = rx;
                self.last_bytes_tx = tx;
                self.last_sample_time = Some(Instant::now());
            }
        }

        metrics
    }

    /// Ping the server and parse latency.
    fn measure_latency(&self, server_ip: &str) -> Option<f64> {
        #[cfg(target_os = "windows")]
        let args = vec!["ping", "-n", "1", "-w", "2000", server_ip];
        #[cfg(not(target_os = "windows"))]
        let args = vec!["ping", "-c", "1", "-W", "2", server_ip];

        let output = Command::new(args[0])
            .args(&args[1..])
            .output()
            .ok()?;

        let stdout = String::from_utf8_lossy(&output.stdout);

        // Parse "time=X.Y ms" or "time=X.Yms"
        for part in stdout.split_whitespace() {
            if part.starts_with("time=") || part.starts_with("time<") {
                let num_str = part
                    .trim_start_matches("time=")
                    .trim_start_matches("time<")
                    .trim_end_matches("ms");
                return num_str.parse::<f64>().ok();
            }
        }

        None
    }

    /// Measure packet loss with a quick ping burst.
    fn measure_packet_loss(&self, server_ip: &str) -> Option<f64> {
        #[cfg(target_os = "windows")]
        let args = vec!["ping", "-n", "5", "-w", "1000", server_ip];
        #[cfg(not(target_os = "windows"))]
        let args = vec!["ping", "-c", "5", "-W", "1", server_ip];

        let output = Command::new(args[0])
            .args(&args[1..])
            .output()
            .ok()?;

        let stdout = String::from_utf8_lossy(&output.stdout);

        // Parse "X% packet loss" or "X% loss"
        for line in stdout.lines() {
            if line.contains("packet loss") || line.contains("loss") {
                for part in line.split_whitespace() {
                    if part.ends_with('%') {
                        let pct_str = part.trim_end_matches('%');
                        return pct_str.parse::<f64>().ok();
                    }
                }
            }
        }

        None
    }

    /// Read RX/TX byte counters from the interface.
    fn read_interface_counters(&self, iface: &str) -> Option<(u64, u64)> {
        #[cfg(target_os = "linux")]
        {
            let rx = std::fs::read_to_string(format!("/sys/class/net/{}/statistics/rx_bytes", iface))
                .ok()?.trim().parse::<u64>().ok()?;
            let tx = std::fs::read_to_string(format!("/sys/class/net/{}/statistics/tx_bytes", iface))
                .ok()?.trim().parse::<u64>().ok()?;
            Some((rx, tx))
        }

        #[cfg(target_os = "macos")]
        {
            let output = Command::new("netstat")
                .args(["-I", iface, "-b"])
                .output()
                .ok()?;
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Parse netstat output: Name Mtu Network Address Ipkts Ierrs Ibytes Opkts Oerrs Obytes
            for line in stdout.lines().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 10 && parts[0] == iface {
                    let ibytes = parts[6].parse::<u64>().ok()?;
                    let obytes = parts[9].parse::<u64>().ok()?;
                    return Some((ibytes, obytes));
                }
            }
            None
        }

        #[cfg(target_os = "windows")]
        {
            // Windows: use netstat -e or PowerShell
            let output = Command::new("powershell")
                .args(["-Command",
                    &format!("(Get-NetAdapterStatistics -Name '{}' | Select-Object ReceivedBytes,SentBytes | ConvertTo-Json)", iface)])
                .output()
                .ok()?;
            let stdout = String::from_utf8_lossy(&output.stdout);
            // Simple JSON parse
            let rx = stdout.split("ReceivedBytes").nth(1)?
                .split(':').nth(1)?
                .split(&[',', '}'][..]).next()?
                .trim().parse::<u64>().ok()?;
            let tx = stdout.split("SentBytes").nth(1)?
                .split(':').nth(1)?
                .split(&[',', '}'][..]).next()?
                .trim().parse::<u64>().ok()?;
            Some((rx, tx))
        }

        #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_metrics() {
        let m = HealthMetrics::default();
        assert!(m.latency_ms.is_none());
        assert!(m.download_bps.is_none());
        assert!(m.timestamp > 0);
    }

    #[test]
    fn test_monitor_initial_state() {
        let monitor = HealthMonitor::new();
        assert!(monitor.vpn_interface.is_none());
        assert!(monitor.connected_at.is_none());
    }

    #[test]
    fn test_on_connected() {
        let mut monitor = HealthMonitor::new();
        monitor.on_connected("wg0", "1.2.3.4");
        assert_eq!(monitor.vpn_interface.as_deref(), Some("wg0"));
        assert!(monitor.connected_at.is_some());
    }

    #[test]
    fn test_on_disconnected() {
        let mut monitor = HealthMonitor::new();
        monitor.on_connected("wg0", "1.2.3.4");
        monitor.on_disconnected();
        assert!(monitor.vpn_interface.is_none());
        assert!(monitor.connected_at.is_none());
    }

    #[test]
    fn test_collect_disconnected() {
        let mut monitor = HealthMonitor::new();
        let metrics = monitor.collect();
        assert!(metrics.uptime_secs.is_none());
        assert!(metrics.latency_ms.is_none());
    }
}
