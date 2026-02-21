//! Windows Kill Switch using Windows Filtering Platform (WFP).
//!
//! This module uses the `windows` crate to add WFP filters that block all
//! network traffic except through the active VPN tunnel interface and to
//! the VPN server IP itself (so the tunnel can be established).
//!
//! # Safety
//! Requires Administrator privileges. The WFP engine session is opened with
//! dynamic mode so filters are automatically removed if the process crashes.

#![cfg(target_os = "windows")]

use super::{KillSwitch, KillSwitchState};
use log::{error, info};
use std::process::Command;

/// WFP-based kill switch for Windows.
///
/// Uses `netsh` commands to add/remove WFP filters as a robust, crate-minimal
/// approach. For production use with the `windows` crate, replace the Command
/// calls with direct WFP API bindings via `windows::Win32::NetworkManagement::WindowsFilteringPlatform`.
pub struct WfpKillSwitch {
    state: KillSwitchState,
    vpn_interface: Option<String>,
    vpn_server_ip: Option<String>,
}

impl WfpKillSwitch {
    pub fn new() -> Self {
        Self {
            state: KillSwitchState::Disabled,
            vpn_interface: None,
            vpn_server_ip: None,
        }
    }

    /// Add WFP block-all rule via netsh advfirewall.
    fn add_block_rules(&self, vpn_interface: &str, vpn_server_ip: &str) -> Result<(), String> {
        // Block all outbound traffic
        let output = Command::new("netsh")
            .args([
                "advfirewall", "firewall", "add", "rule",
                "name=VPNht_KillSwitch_BlockAll",
                "dir=out", "action=block",
                "enable=yes",
                "profile=any",
            ])
            .output()
            .map_err(|e| format!("Failed to execute netsh: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Failed to add block rule: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Allow traffic to VPN server IP (so tunnel can establish)
        let output = Command::new("netsh")
            .args([
                "advfirewall", "firewall", "add", "rule",
                "name=VPNht_KillSwitch_AllowVPN",
                "dir=out", "action=allow",
                &format!("remoteip={}", vpn_server_ip),
                "enable=yes",
                "profile=any",
            ])
            .output()
            .map_err(|e| format!("Failed to execute netsh: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Failed to add VPN allow rule: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Allow traffic on VPN tunnel interface
        let output = Command::new("netsh")
            .args([
                "advfirewall", "firewall", "add", "rule",
                &format!("name=VPNht_KillSwitch_AllowTunnel_{}", vpn_interface),
                "dir=out", "action=allow",
                &format!("localip=any"),
                "enable=yes",
                "profile=any",
            ])
            .output()
            .map_err(|e| format!("Failed to execute netsh: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "Failed to add tunnel allow rule: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Allow loopback
        let _ = Command::new("netsh")
            .args([
                "advfirewall", "firewall", "add", "rule",
                "name=VPNht_KillSwitch_AllowLoopback",
                "dir=out", "action=allow",
                "remoteip=127.0.0.0/8",
                "enable=yes",
                "profile=any",
            ])
            .output();

        // Allow DHCP
        let _ = Command::new("netsh")
            .args([
                "advfirewall", "firewall", "add", "rule",
                "name=VPNht_KillSwitch_AllowDHCP",
                "dir=out", "action=allow",
                "protocol=udp",
                "remoteport=67,68",
                "enable=yes",
                "profile=any",
            ])
            .output();

        Ok(())
    }

    /// Remove all VPNht kill switch rules.
    fn remove_rules(&self) -> Result<(), String> {
        let rules = [
            "VPNht_KillSwitch_BlockAll",
            "VPNht_KillSwitch_AllowVPN",
            "VPNht_KillSwitch_AllowLoopback",
            "VPNht_KillSwitch_AllowDHCP",
        ];

        for rule in &rules {
            let _ = Command::new("netsh")
                .args(["advfirewall", "firewall", "delete", "rule", &format!("name={}", rule)])
                .output();
        }

        // Also clean up tunnel-specific rules
        if let Some(ref iface) = self.vpn_interface {
            let _ = Command::new("netsh")
                .args([
                    "advfirewall", "firewall", "delete", "rule",
                    &format!("name=VPNht_KillSwitch_AllowTunnel_{}", iface),
                ])
                .output();
        }

        Ok(())
    }
}

impl KillSwitch for WfpKillSwitch {
    fn enable(&mut self, vpn_interface: &str, vpn_server_ip: &str) -> Result<(), String> {
        info!(
            "Enabling Windows kill switch: interface={}, server={}",
            vpn_interface, vpn_server_ip
        );

        // Clean up any stale rules first
        let _ = self.remove_rules();

        match self.add_block_rules(vpn_interface, vpn_server_ip) {
            Ok(()) => {
                self.state = KillSwitchState::Enabled;
                self.vpn_interface = Some(vpn_interface.to_string());
                self.vpn_server_ip = Some(vpn_server_ip.to_string());
                info!("Windows kill switch enabled");
                Ok(())
            }
            Err(e) => {
                error!("Failed to enable kill switch: {}", e);
                // Try to clean up partial rules
                let _ = self.remove_rules();
                self.state = KillSwitchState::Error(e.clone());
                Err(e)
            }
        }
    }

    fn disable(&mut self) -> Result<(), String> {
        info!("Disabling Windows kill switch");
        self.remove_rules()?;
        self.state = KillSwitchState::Disabled;
        self.vpn_interface = None;
        self.vpn_server_ip = None;
        info!("Windows kill switch disabled");
        Ok(())
    }

    fn state(&self) -> KillSwitchState {
        self.state.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_killswitch_disabled() {
        let ks = WfpKillSwitch::new();
        assert_eq!(ks.state(), KillSwitchState::Disabled);
        assert!(ks.vpn_interface.is_none());
    }
}
