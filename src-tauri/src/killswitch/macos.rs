//! macOS Kill Switch using pf (Packet Filter).
//!
//! Uses `pfctl` commands to block all non-VPN traffic. Requires root/admin privileges.
//! The original pf configuration is backed up and restored on disable.

#![cfg(target_os = "macos")]

use super::{KillSwitch, KillSwitchState};
use log::{error, info};
use std::fs;
use std::process::Command;

const PF_RULES_PATH: &str = "/tmp/vpnht_pf_rules.conf";
const PF_BACKUP_PATH: &str = "/tmp/vpnht_pf_backup.conf";

/// pf-based kill switch for macOS.
pub struct PfKillSwitch {
    state: KillSwitchState,
    vpn_interface: Option<String>,
    vpn_server_ip: Option<String>,
}

impl PfKillSwitch {
    pub fn new() -> Self {
        Self {
            state: KillSwitchState::Disabled,
            vpn_interface: None,
            vpn_server_ip: None,
        }
    }

    /// Backup current pf rules.
    fn backup_rules(&self) -> Result<(), String> {
        let output = Command::new("pfctl")
            .args(["-sr"])
            .output()
            .map_err(|e| format!("Failed to read pf rules: {}", e))?;

        fs::write(PF_BACKUP_PATH, &output.stdout)
            .map_err(|e| format!("Failed to backup pf rules: {}", e))?;
        Ok(())
    }

    /// Generate and apply VPN-only pf rules.
    fn apply_vpn_rules(&self, vpn_interface: &str, vpn_server_ip: &str) -> Result<(), String> {
        let rules = format!(
            r#"# VPNht Kill Switch Rules
# Block all traffic by default
block all

# Allow loopback
pass quick on lo0 all

# Allow traffic to/from VPN server (tunnel establishment)
pass out quick proto udp to {server} port 51820
pass in quick proto udp from {server} port 51820

# Allow all traffic on VPN tunnel interface
pass quick on {iface} all

# Allow DHCP
pass out quick proto udp from any port 68 to any port 67
pass in quick proto udp from any port 67 to any port 68

# Allow DNS through VPN only
pass out quick on {iface} proto udp to any port 53
pass out quick on {iface} proto tcp to any port 53
"#,
            server = vpn_server_ip,
            iface = vpn_interface,
        );

        fs::write(PF_RULES_PATH, &rules)
            .map_err(|e| format!("Failed to write pf rules: {}", e))?;

        // Load rules
        let output = Command::new("pfctl")
            .args(["-f", PF_RULES_PATH])
            .output()
            .map_err(|e| format!("Failed to load pf rules: {}", e))?;

        if !output.status.success() {
            return Err(format!(
                "pfctl load failed: {}",
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        // Enable pf
        let output = Command::new("pfctl")
            .args(["-e"])
            .output()
            .map_err(|e| format!("Failed to enable pf: {}", e))?;

        // pfctl -e returns exit code 1 if already enabled, check stderr
        let stderr = String::from_utf8_lossy(&output.stderr);
        if !output.status.success() && !stderr.contains("already enabled") {
            return Err(format!("Failed to enable pf: {}", stderr));
        }

        Ok(())
    }

    /// Restore original pf rules.
    fn restore_rules(&self) -> Result<(), String> {
        if std::path::Path::new(PF_BACKUP_PATH).exists() {
            let output = Command::new("pfctl")
                .args(["-f", PF_BACKUP_PATH])
                .output()
                .map_err(|e| format!("Failed to restore pf rules: {}", e))?;

            if !output.status.success() {
                // Try loading default rules as fallback
                let _ = Command::new("pfctl")
                    .args(["-f", "/etc/pf.conf"])
                    .output();
            }

            let _ = fs::remove_file(PF_BACKUP_PATH);
        } else {
            // Restore system defaults
            let _ = Command::new("pfctl")
                .args(["-f", "/etc/pf.conf"])
                .output();
        }

        // Clean up temp rules file
        let _ = fs::remove_file(PF_RULES_PATH);
        Ok(())
    }
}

impl KillSwitch for PfKillSwitch {
    fn enable(&mut self, vpn_interface: &str, vpn_server_ip: &str) -> Result<(), String> {
        info!(
            "Enabling macOS kill switch: interface={}, server={}",
            vpn_interface, vpn_server_ip
        );

        self.backup_rules()?;

        match self.apply_vpn_rules(vpn_interface, vpn_server_ip) {
            Ok(()) => {
                self.state = KillSwitchState::Enabled;
                self.vpn_interface = Some(vpn_interface.to_string());
                self.vpn_server_ip = Some(vpn_server_ip.to_string());
                info!("macOS kill switch enabled");
                Ok(())
            }
            Err(e) => {
                error!("Failed to enable kill switch: {}", e);
                let _ = self.restore_rules();
                self.state = KillSwitchState::Error(e.clone());
                Err(e)
            }
        }
    }

    fn disable(&mut self) -> Result<(), String> {
        info!("Disabling macOS kill switch");
        self.restore_rules()?;
        self.state = KillSwitchState::Disabled;
        self.vpn_interface = None;
        self.vpn_server_ip = None;
        info!("macOS kill switch disabled");
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
        let ks = PfKillSwitch::new();
        assert_eq!(ks.state(), KillSwitchState::Disabled);
    }
}
