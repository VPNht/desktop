use std::net::UdpSocket;
use std::time::Duration;
use tracing::{info, warn};

/// Network interface information.
#[derive(Debug, Clone, serde::Serialize)]
pub struct NetworkInterface {
    pub name: String,
    pub is_vpn: bool,
    pub ip: Option<String>,
}

/// Get the default network interface by checking UDP socket routing.
pub fn get_default_interface() -> Result<String, String> {
    let socket = UdpSocket::bind("0.0.0.0:0")
        .map_err(|e| format!("Failed to bind UDP socket: {}", e))?;
    socket
        .connect("8.8.8.8:80")
        .map_err(|e| format!("Failed to connect UDP socket: {}", e))?;
    let local_addr = socket
        .local_addr()
        .map_err(|e| format!("Failed to get local address: {}", e))?;
    Ok(local_addr.ip().to_string())
}

/// Check if a VPN tunnel interface is active.
pub fn is_vpn_interface_active() -> bool {
    #[cfg(target_os = "linux")]
    {
        if let Ok(entries) = std::fs::read_dir("/sys/class/net") {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if name.starts_with("tun") || name.starts_with("wg") {
                    return true;
                }
            }
        }
        false
    }

    #[cfg(not(target_os = "linux"))]
    {
        // Placeholder for Windows/macOS
        warn!("VPN interface detection not implemented for this platform");
        false
    }
}

/// Monitor network connectivity and return status.
#[derive(Debug, Clone, serde::Serialize)]
pub struct NetworkStatus {
    pub connected: bool,
    pub vpn_active: bool,
    pub default_ip: Option<String>,
}

pub fn check_network_status() -> NetworkStatus {
    let default_ip = get_default_interface().ok();
    let vpn_active = is_vpn_interface_active();
    let connected = default_ip.is_some();

    info!(
        connected,
        vpn_active,
        default_ip = ?default_ip,
        "Network status checked"
    );

    NetworkStatus {
        connected,
        vpn_active,
        default_ip,
    }
}
