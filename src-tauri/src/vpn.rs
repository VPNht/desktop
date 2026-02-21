use serde::{Deserialize, Serialize};
use std::process::Command;
use std::time::Duration;
use tokio::time::sleep;

use crate::error::Result;
use crate::config::WireGuardConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ConnectionStatus {
    Disconnected,
    Connecting,
    Connected { server_id: String, connected_at: i64 },
    Disconnecting,
    Error(String),
}

pub struct ConnectionManager {
    status: ConnectionStatus,
    interface_name: String,
}

impl ConnectionManager {
    pub fn new() -> Self {
        Self {
            status: ConnectionStatus::Disconnected,
            interface_name: Self::get_interface_name(),
        }
    }

    #[cfg(target_os = "windows")]
    fn get_interface_name() -> String {
        "VPNht".to_string()
    }

    #[cfg(target_os = "macos")]
    fn get_interface_name() -> String {
        "utun5".to_string()
    }

    #[cfg(target_os = "linux")]
    fn get_interface_name() -> String {
        "wg0".to_string()
    }

    pub async fn connect(&mut self, server_id: &str) -> Result<()> {
        if matches!(self.status, ConnectionStatus::Connected { .. }) {
            return Err("Already connected".to_string());
        }

        self.status = ConnectionStatus::Connecting;

        // Generate WireGuard config
        let config = crate::config::generate_wireguard_config(server_id)?;

        // Validate config
        if !self.validate_config(&config) {
            self.status = ConnectionStatus::Error("Invalid configuration".to_string());
            return Err("Configuration validation failed".to_string());
        }

        // Apply WireGuard config
        match self.apply_config(&config).await {
            Ok(_) => {
                self.status = ConnectionStatus::Connected {
                    server_id: server_id.to_string(),
                    connected_at: chrono::Utc::now().timestamp(),
                };
                Ok(())
            }
            Err(e) => {
                self.status = ConnectionStatus::Error(e.clone());
                Err(e)
            }
        }
    }

    pub async fn disconnect(&mut self) -> Result<()> {
        if matches!(self.status, ConnectionStatus::Disconnected) {
            return Ok(());
        }

        self.status = ConnectionStatus::Disconnecting;

        // Remove WireGuard interface
        match self.remove_interface().await {
            Ok(_) => {
                self.status = ConnectionStatus::Disconnected;
                Ok(())
            }
            Err(e) => {
                self.status = ConnectionStatus::Error(e.clone());
                Err(e)
            }
        }
    }

    pub async fn get_status(&self) -> ConnectionStatus {
        self.status.clone()
    }

    fn validate_config(&self, config: &WireGuardConfig) -> bool {
        if config.interface.private_key.is_empty() {
            return false;
        }
        if config.peer.public_key.is_empty() {
            return false;
        }
        if config.peer.endpoint.is_empty() {
            return false;
        }
        true
    }

    async fn apply_config(&self, config: &WireGuardConfig) -> Result<()> {
        let config_str = config.to_wg_quick_format();

        #[cfg(target_os = "linux")]
        {
            // Write config to /tmp and use wg-quick
            let config_path = format!("/tmp/vpnht-{}.conf", self.interface_name);
            std::fs::write(&config_path, config_str)
                .map_err(|e| format!("Failed to write config: {}", e))?;

            let output = Command::new("wg-quick")
                .args([&"up".to_string(), self.interface_name.clone()])
                .output()
                .map_err(|e| format!("Failed to start WireGuard: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wg-quick failed: {}", stderr));
            }
        }

        #[cfg(target_os = "macos")]
        {
            // macOS uses wireguard-go
            let config_path = format!("/tmp/vpnht-{}.conf", self.interface_name);
            std::fs::write(&config_path, config_str)
                .map_err(|e| format!("Failed to write config: {}", e))?;

            let output = Command::new("wireguard-go")
                .args([&self.interface_name])
                .output()
                .map_err(|e| format!("Failed to start WireGuard: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wireguard-go failed: {}", stderr));
            }

            // Set configuration
            Command::new("wg")
                .args([&"setconf".to_string(), self.interface_name.clone(), config_path])
                .output()
                .map_err(|e| format!("Failed to set config: {}", e))?;
        }

        #[cfg(target_os = "windows")]
        {
            // Windows uses wireguard.exe
            let config_path = format!("{}\\AppData\\Local\\Temp\\vpnht.conf", std::env::var("USERPROFILE").unwrap_or_default());
            std::fs::write(&config_path, config_str)
                .map_err(|e| format!("Failed to write config: {}", e))?;

            let output = Command::new("wireguard.exe")
                .args([&"/installtunnelservice".to_string(), config_path])
                .output()
                .map_err(|e| format!("Failed to install WireGuard service: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wireguard.exe failed: {}", stderr));
            }
        }

        Ok(())
    }

    async fn remove_interface(&self) -> Result<()> {
        #[cfg(target_os = "linux")]
        {
            let output = Command::new("wg-quick")
                .args([&"down".to_string(), self.interface_name.clone()])
                .output()
                .map_err(|e| format!("Failed to stop WireGuard: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wg-quick down failed: {}", stderr));
            }
        }

        #[cfg(target_os = "macos")]
        {
            let output = Command::new("wireguard-go")
                .args([&"-down".to_string(), &self.interface_name])
                .output()
                .map_err(|e| format!("Failed to stop WireGuard: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wireguard-go down failed: {}", stderr));
            }
        }

        #[cfg(target_os = "windows")]
        {
            let output = Command::new("wireguard.exe")
                .args([&"/uninstalltunnelservice".to_string(), self.interface_name.clone()])
                .output()
                .map_err(|e| format!("Failed to uninstall WireGuard service: {}", e))?;

            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                return Err(format!("wireguard.exe uninstall failed: {}", stderr));
            }
        }

        Ok(())
    }
}

impl Default for ConnectionManager {
    fn default() -> Self {
        Self::new()
    }
}
