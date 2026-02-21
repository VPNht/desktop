//! Split Tunneling — Allow specific apps or IPs to bypass the VPN.
//!
//! Platform-specific implementations:
//! - **Windows**: Uses `netsh advfirewall` rules (WFP-based)
//! - **macOS**: Uses `pf` (Packet Filter) route rules
//! - **Linux**: Uses `iptables` marking + policy routing

use log::{error, info};
use serde::{Deserialize, Serialize};
use std::process::Command;

/// Split tunnel configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitTunnelConfig {
    /// Whether split tunneling is enabled.
    pub enabled: bool,
    /// IPs/CIDRs that should bypass the VPN (go through normal routing).
    pub bypass_ips: Vec<String>,
    /// Application paths that should bypass the VPN (platform-dependent).
    pub bypass_apps: Vec<String>,
}

impl Default for SplitTunnelConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            bypass_ips: Vec::new(),
            bypass_apps: Vec::new(),
        }
    }
}

/// Split tunnel state.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SplitTunnelState {
    Disabled,
    Active { bypass_ips: Vec<String>, bypass_apps: Vec<String> },
    Error(String),
}

/// Split tunnel manager.
pub struct SplitTunnelManager {
    config: SplitTunnelConfig,
    state: SplitTunnelState,
    vpn_interface: Option<String>,
    default_gateway: Option<String>,
}

impl SplitTunnelManager {
    pub fn new() -> Self {
        Self {
            config: SplitTunnelConfig::default(),
            state: SplitTunnelState::Disabled,
            vpn_interface: None,
            default_gateway: None,
        }
    }

    pub fn state(&self) -> SplitTunnelState {
        self.state.clone()
    }

    pub fn config(&self) -> SplitTunnelConfig {
        self.config.clone()
    }

    /// Update split tunnel configuration and apply if VPN is active.
    pub fn set_config(&mut self, config: SplitTunnelConfig) -> Result<(), String> {
        let was_active = self.config.enabled && self.vpn_interface.is_some();
        self.config = config;

        if was_active {
            self.disable()?;
        }

        if self.config.enabled && self.vpn_interface.is_some() {
            self.apply_rules()?;
        } else if !self.config.enabled {
            self.state = SplitTunnelState::Disabled;
        }

        Ok(())
    }

    /// Called when VPN connects. Apply split tunnel rules if enabled.
    pub fn on_vpn_connected(&mut self, vpn_interface: &str, default_gateway: &str) -> Result<(), String> {
        self.vpn_interface = Some(vpn_interface.to_string());
        self.default_gateway = Some(default_gateway.to_string());

        if self.config.enabled {
            self.apply_rules()
        } else {
            Ok(())
        }
    }

    /// Called when VPN disconnects. Clean up rules.
    pub fn on_vpn_disconnected(&mut self) -> Result<(), String> {
        if self.config.enabled {
            self.disable()?;
        }
        self.vpn_interface = None;
        self.default_gateway = None;
        Ok(())
    }

    /// Enable split tunneling with current config.
    pub fn enable(&mut self) -> Result<(), String> {
        self.config.enabled = true;
        if self.vpn_interface.is_some() {
            self.apply_rules()
        } else {
            Ok(())
        }
    }

    /// Disable split tunneling and remove all rules.
    pub fn disable(&mut self) -> Result<(), String> {
        info!("Disabling split tunneling");
        self.remove_rules()?;
        self.state = SplitTunnelState::Disabled;
        Ok(())
    }

    /// Apply platform-specific split tunnel rules.
    fn apply_rules(&mut self) -> Result<(), String> {
        let vpn_iface = self.vpn_interface.as_ref()
            .ok_or("VPN interface not set")?;
        let default_gw = self.default_gateway.as_ref()
            .ok_or("Default gateway not set")?;

        info!("Applying split tunnel rules: {} bypass IPs, {} bypass apps",
            self.config.bypass_ips.len(), self.config.bypass_apps.len());

        #[cfg(target_os = "linux")]
        self.apply_linux_rules(vpn_iface, default_gw)?;

        #[cfg(target_os = "macos")]
        self.apply_macos_rules(vpn_iface, default_gw)?;

        #[cfg(target_os = "windows")]
        self.apply_windows_rules(vpn_iface, default_gw)?;

        self.state = SplitTunnelState::Active {
            bypass_ips: self.config.bypass_ips.clone(),
            bypass_apps: self.config.bypass_apps.clone(),
        };

        Ok(())
    }

    /// Remove platform-specific rules.
    fn remove_rules(&self) -> Result<(), String> {
        #[cfg(target_os = "linux")]
        self.remove_linux_rules()?;

        #[cfg(target_os = "macos")]
        self.remove_macos_rules()?;

        #[cfg(target_os = "windows")]
        self.remove_windows_rules()?;

        Ok(())
    }

    // ── Linux: iptables + ip rule ──

    #[cfg(target_os = "linux")]
    fn apply_linux_rules(&self, _vpn_iface: &str, default_gw: &str) -> Result<(), String> {
        // Create routing table for bypassed traffic
        let _ = Command::new("ip")
            .args(["rule", "add", "fwmark", "0x1", "table", "100"])
            .output();

        let _ = Command::new("ip")
            .args(["route", "add", "default", "via", default_gw, "table", "100"])
            .output();

        // Mark packets from bypass IPs
        for ip in &self.config.bypass_ips {
            let _ = Command::new("iptables")
                .args(["-t", "mangle", "-A", "OUTPUT",
                       "-d", ip, "-j", "MARK", "--set-mark", "0x1"])
                .output();
            info!("Split tunnel: bypass IP {}", ip);
        }

        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn remove_linux_rules(&self) -> Result<(), String> {
        let _ = Command::new("iptables")
            .args(["-t", "mangle", "-F", "OUTPUT"])
            .output();
        let _ = Command::new("ip")
            .args(["rule", "del", "fwmark", "0x1", "table", "100"])
            .output();
        let _ = Command::new("ip")
            .args(["route", "flush", "table", "100"])
            .output();
        Ok(())
    }

    // ── macOS: route commands ──

    #[cfg(target_os = "macos")]
    fn apply_macos_rules(&self, _vpn_iface: &str, default_gw: &str) -> Result<(), String> {
        for ip in &self.config.bypass_ips {
            let output = Command::new("route")
                .args(["add", "-net", ip, default_gw])
                .output()
                .map_err(|e| format!("Failed to add route: {}", e))?;

            if output.status.success() {
                info!("Split tunnel: bypass IP {} via {}", ip, default_gw);
            } else {
                error!("Failed to add route for {}: {}",
                    ip, String::from_utf8_lossy(&output.stderr));
            }
        }
        Ok(())
    }

    #[cfg(target_os = "macos")]
    fn remove_macos_rules(&self) -> Result<(), String> {
        for ip in &self.config.bypass_ips {
            let _ = Command::new("route")
                .args(["delete", "-net", ip])
                .output();
        }
        Ok(())
    }

    // ── Windows: route commands ──

    #[cfg(target_os = "windows")]
    fn apply_windows_rules(&self, _vpn_iface: &str, default_gw: &str) -> Result<(), String> {
        for ip in &self.config.bypass_ips {
            // Determine if CIDR or single IP
            let (dest, mask) = if ip.contains('/') {
                let parts: Vec<&str> = ip.split('/').collect();
                let prefix: u32 = parts[1].parse().unwrap_or(32);
                let mask = if prefix == 0 { "0.0.0.0".to_string() }
                    else { format!("{}.{}.{}.{}",
                        (0xFFFFFFFFu32 << (32 - prefix)) >> 24 & 0xFF,
                        (0xFFFFFFFFu32 << (32 - prefix)) >> 16 & 0xFF,
                        (0xFFFFFFFFu32 << (32 - prefix)) >> 8 & 0xFF,
                        (0xFFFFFFFFu32 << (32 - prefix)) & 0xFF,
                    )};
                (parts[0].to_string(), mask)
            } else {
                (ip.clone(), "255.255.255.255".to_string())
            };

            let output = Command::new("route")
                .args(["add", &dest, "mask", &mask, default_gw])
                .output()
                .map_err(|e| format!("Failed to add route: {}", e))?;

            if output.status.success() {
                info!("Split tunnel: bypass {} via {}", ip, default_gw);
            }
        }
        Ok(())
    }

    #[cfg(target_os = "windows")]
    fn remove_windows_rules(&self) -> Result<(), String> {
        for ip in &self.config.bypass_ips {
            let dest = if ip.contains('/') {
                ip.split('/').next().unwrap_or(ip)
            } else {
                ip.as_str()
            };
            let _ = Command::new("route")
                .args(["delete", dest])
                .output();
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = SplitTunnelConfig::default();
        assert!(!config.enabled);
        assert!(config.bypass_ips.is_empty());
        assert!(config.bypass_apps.is_empty());
    }

    #[test]
    fn test_manager_initial_state() {
        let manager = SplitTunnelManager::new();
        match manager.state() {
            SplitTunnelState::Disabled => {}
            _ => panic!("Expected Disabled"),
        }
    }

    #[test]
    fn test_set_config() {
        let mut manager = SplitTunnelManager::new();
        let config = SplitTunnelConfig {
            enabled: true,
            bypass_ips: vec!["192.168.1.0/24".to_string()],
            bypass_apps: vec![],
        };
        // Should succeed even without VPN connected (rules just won't apply)
        manager.set_config(config.clone()).unwrap();
        assert!(manager.config().enabled);
        assert_eq!(manager.config().bypass_ips.len(), 1);
    }
}
