use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tokio::process::Command;

use directories::ProjectDirs;

use crate::crypto::{decrypt_data, encrypt_data};

#[derive(Debug)]
enum Platform {
    Linux,
    MacOS,
    Windows,
    Other,
}

fn get_platform() -> Platform {
    #[cfg(target_os = "linux")]
    return Platform::Linux;
    #[cfg(target_os = "macos")]
    return Platform::MacOS;
    #[cfg(target_os = "windows")]
    return Platform::Windows;
    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    return Platform::Other;
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VpnStatus {
    Disconnected,
    Connecting,
    Connected { interface: String, endpoint: String },
    Disconnecting,
    Error(String),
}

#[derive(Debug)]
pub struct WireGuardManager {
    current_interface: Option<String>,
    status: Arc<Mutex<VpnStatus>>,
}

impl WireGuardManager {
    pub fn new() -> Self {
        WireGuardManager {
            current_interface: None,
            status: Arc::new(Mutex::new(VpnStatus::Disconnected)),
        }
    }

    pub fn get_status(&self) -> VpnStatus {
        self.status.lock().unwrap().clone()
    }

    pub async fn connect(&self,
        config: String,
        config_name: &str,
    ) -> Result<String, String> {
        let interface_name = format!("vpnht_{}", config_name);
        
        *self.status.lock().unwrap() = VpnStatus::Connecting;

        match get_platform() {
            Platform::Linux => {
                self.connect_linux(&config, &interface_name).await
            }
            Platform::MacOS => {
                self.connect_macos(&config, &interface_name).await
            }
            Platform::Windows => {
                self.connect_windows(&config, &interface_name).await
            }
            _ => Err("Unsupported platform".to_string()),
        }
    }

    async fn connect_linux(
&self,
        config: &str,
        interface_name: &str,
    ) -> Result<String, String> {
        let config_path = format!("/tmp/{}_.conf", interface_name);
        let sanitized_name = interface_name.replace(|c: char| !c.is_alphanumeric() && c != '_', "");
        let actual_interface = &sanitized_name[..sanitized_name.len().min(15)];
        
        // Write config to temp file
        fs::write(&config_path, config)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        // Copy to WireGuard directory (requires elevated permissions)
        let wg_config_path = format!("/etc/wireguard/{}_.conf", actual_interface);
        
        let cp_output = Command::new("pkexec")
            .args([
                "cp",
                &config_path,
                &wg_config_path,
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to copy config: {}", e))?;

        if !cp_output.status.success() {
            let stderr = String::from_utf8_lossy(&cp_output.stderr);
            return Err(format!("Failed to copy config: {}", stderr));
        }

        let output = Command::new("pkexec")
            .args([
                "wg-quick",
                "up",
                &actual_interface.to_string(),
            ])
            .output()
            .await
            .map_err(|e| format!("Failed to start WireGuard: {}", e))?;

        if output.status.success() {
            let endpoint = self.parse_endpoint(config)?;
            *self.status.lock().unwrap() = VpnStatus::Connected {
                interface: actual_interface.to_string(),
                endpoint: endpoint.clone(),
            };
            
            // Clean up temp file
            let _ = fs::remove_file(&config_path);
            
            Ok(format!("Connected to {}", endpoint))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to connect: {}", stderr))
        }
    }

    async fn connect_macos(
&self,
        config: &str,
        interface_name: &str,
    ) -> Result<String, String> {
        let config_path = format!("/tmp/{}_.conf", interface_name);
        let sanitized_name = interface_name.replace(|c: char| !c.is_alphanumeric() && c != '_', "");
        
        // Write config to temp file
        fs::write(&config_path, config)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        // Copy to WireGuard tunnel directory
        let tunnel_path = PathBuf::from(format!(
            "/usr/local/etc/wireguard/{}_.conf",
            sanitized_name
        ));
        
        // Ensure directory exists
        let _ = Command::new("sudo")
            .args(["mkdir", "-p", "/usr/local/etc/wireguard"])
            .output()
            .await;

        let cp_output = Command::new("sudo")
            .args(["cp", &config_path, &tunnel_path.to_string_lossy().into_owned()])
            .output()
            .await
            .map_err(|e| format!("Failed to copy config: {}", e))?;

        if !cp_output.status.success() {
            let stderr = String::from_utf8_lossy(&cp_output.stderr);
            // Try alternative method using wg-quick directly
            let output = Command::new("sudo")
                .args([
                    "bash",
                    "-c",
                    &format!("wg-quick up < {}", config_path),
                ])
                .output()
                .await
                .map_err(|e| format!("Failed to start WireGuard: {}", e))?;

            if output.status.success() {
                let endpoint = self.parse_endpoint(config)?;
                *self.status.lock().unwrap() = VpnStatus::Connected {
                    interface: sanitized_name.clone(),
                    endpoint: endpoint.clone(),
                };
                let _ = fs::remove_file(&config_path);
                return Ok(format!("Connected to {}", endpoint));
            }
            return Err(format!("Failed to copy config: {}", stderr));
        }

        // Start WireGuard interface
        let output = Command::new("sudo")
            .args(["wg-quick", "up", &sanitized_name[..sanitized_name.len().min(15)]])
            .output()
            .await
            .map_err(|e| format!("Failed to start WireGuard: {}", e))?;

        if output.status.success() {
            let endpoint = self.parse_endpoint(config)?;
            *self.status.lock().unwrap() = VpnStatus::Connected {
                interface: sanitized_name,
                endpoint: endpoint.clone(),
            };
            let _ = fs::remove_file(&config_path);
            Ok(format!("Connected to {}", endpoint))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to connect: {}", stderr))
        }
    }

    #[cfg(target_os = "windows")]
    async fn connect_windows(
&self,
        config: &str,
        interface_name: &str,
    ) -> Result<String, String> {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        let app_data = std::env::var("LOCALAPPDATA")
            .map_err(|_| "Could not find AppData folder".to_string())?;
        let config_dir = PathBuf::from(app_data).join("VPNht").join("configs");
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("Failed to create config dir: {}", e))?;

        let config_path = config_dir.join(format!("{}_.conf", interface_name));
        fs::write(&config_path, config)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        // Use wireguard.exe service command
        let tunnel_name = interface_name[..interface_name.len().min(32)].to_string();
        
        let output = std::process::Command::new("wireguard.exe")
            .args([
                "/installtunnelservice",
                &config_path.to_string_lossy(),
            ])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Failed to install tunnel: {}", e))?;

        if output.status.success() || String::from_utf8_lossy(&output.stderr).contains("already exists")
        {
            // Start the service
            let _ = std::process::Command::new("sc")
                .args(["start", &format!("WireGuardTunnel${}", tunnel_name)])
                .creation_flags(CREATE_NO_WINDOW)
                .output();

            let endpoint = self.parse_endpoint(config)?;
            *self.status.lock().unwrap() = VpnStatus::Connected {
                interface: tunnel_name,
                endpoint: endpoint.clone(),
            };
            Ok(format!("Connected to {}", endpoint))
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to connect: {}", stderr))
        }
    }

    #[cfg(not(target_os = "windows"))]
    async fn connect_windows(
&self,
        _config: &str,
        _interface_name: &str,
    ) -> Result<String, String> {
        Err("Windows connection not available on this platform".to_string())
    }

    pub async fn disconnect(&self,
    ) -> Result<String, String> {
        let status = self.get_status();
        let interface_name = match &status {
            VpnStatus::Connected { interface, .. } => interface.clone(),
            VpnStatus::Connecting => return Err("Cannot disconnect while connecting".to_string()),
            VpnStatus::Disconnecting => return Ok("Already disconnecting".to_string()),
            _ => return Ok("Not currently connected".to_string()),
        };

        *self.status.lock().unwrap() = VpnStatus::Disconnecting;

        match get_platform() {
            Platform::Linux => self.disconnect_linux(&interface_name).await,
            Platform::MacOS => self.disconnect_macos(&interface_name).await,
            Platform::Windows => self.disconnect_windows(&interface_name).await,
            _ => Err("Unsupported platform".to_string()),
        }
    }

    async fn disconnect_linux(&self,
        interface_name: &str,
    ) -> Result<String, String> {
        let output = Command::new("pkexec")
            .args(["wg-quick", "down", interface_name])
            .output()
            .await
            .map_err(|e| format!("Failed to stop WireGuard: {}", e))?;

        if output.status.success() {
            // Clean up config file
            let _ = Command::new("pkexec")
                .args(["rm", "-f", &format!("/etc/wireguard/{}_.conf", interface_name)])
                .output()
                .await;

            *self.status.lock().unwrap() = VpnStatus::Disconnected;
            Ok("Disconnected successfully".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to disconnect: {}", stderr))
        }
    }

    async fn disconnect_macos(&self, interface_name: &str) -> Result<String, String> {
        let output = Command::new("sudo")
            .args(["wg-quick", "down", interface_name])
            .output()
            .await
            .map_err(|e| format!("Failed to stop WireGuard: {}", e))?;

        if output.status.success() {
            let _ = Command::new("sudo")
                .args([
                    "rm",
                    "-f",
                    &format!("/usr/local/etc/wireguard/{}_.conf", interface_name),
                ])
                .output()
                .await;

            *self.status.lock().unwrap() = VpnStatus::Disconnected;
            Ok("Disconnected successfully".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to disconnect: {}", stderr))
        }
    }

    #[cfg(target_os = "windows")]
    async fn disconnect_windows(&self, interface_name: &str) -> Result<String, String> {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;

        // Stop the service
        let _ = std::process::Command::new("sc")
            .args(["stop", &format!("WireGuardTunnel${}", interface_name)])
            .creation_flags(CREATE_NO_WINDOW)
            .output();

        let output = std::process::Command::new("wireguard.exe")
            .args(["/uninstalltunnelservice", interface_name])
            .creation_flags(CREATE_NO_WINDOW)
            .output()
            .map_err(|e| format!("Failed to stop WireGuard: {}", e))?;

        if output.status.success() {
            *self.status.lock().unwrap() = VpnStatus::Disconnected;
            Ok("Disconnected successfully".to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Still mark as disconnected if service doesn't exist
            if stderr.contains("does not exist") {
                *self.status.lock().unwrap() = VpnStatus::Disconnected;
                return Ok("Disconnected".to_string());
            }
            *self.status.lock().unwrap() = VpnStatus::Error(stderr.to_string());
            Err(format!("Failed to disconnect: {}", stderr))
        }
    }

    #[cfg(not(target_os = "windows"))]
    async fn disconnect_windows(&self, _interface_name: &str) -> Result<String, String> {
        Err("Windows disconnection not available on this platform".to_string())
    }

    fn parse_endpoint(&self, config: &str) -> Result<String, String> {
        for line in config.lines() {
            if line.trim().starts_with("Endpoint") {
                let parts: Vec<&str> = line.splitn(2, '=').collect();
                if parts.len() == 2 {
                    return Ok(parts[1].trim().to_string());
                }
            }
        }
        Ok("Unknown endpoint".to_string())
    }
}

pub async fn save_config(
    config_name: &str,
    config_data: &str,
    encryption_key: Option<&str>,
) -> Result<String, String> {
    let config_dir = get_config_dir()?;
    fs::create_dir_all(&config_dir).map_err(|e| format!("Failed to create config dir: {}", e))?;

    let config_path = config_dir.join(format!("{}_.conf.enc", config_name));

    let data_to_save = if let Some(key) = encryption_key {
        encrypt_data(config_data, key)?
    } else {
        config_data.to_string()
    };

    fs::write(&config_path, data_to_save)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(format!("Config saved to {:?}", config_path))
}

fn get_config_dir() -> Result<PathBuf, String> {
    ProjectDirs::from("com", "VPNht", "VPNhtDesktop")
        .map(|dirs| dirs.config_dir().to_path_buf())
        .ok_or("Failed to get config directory".to_string())
}

pub async fn load_config(
    config_name: &str,
    encryption_key: Option<&str>,
) -> Result<String, String> {
    let config_dir = get_config_dir()?;
    let config_path = config_dir.join(format!("{}_.conf.enc", config_name));

    let encrypted_data = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read config: {}", e))?;

    let data = if let Some(key) = encryption_key {
        decrypt_data(&encrypted_data, key)?
    } else {
        encrypted_data
    };

    Ok(data)
}

pub async fn list_configs() -> Result<Vec<String>, String> {
    let config_dir = get_config_dir()?;
    
    if !config_dir.exists() {
        return Ok(Vec::new());
    }

    let mut configs = Vec::new();
    
    for entry in fs::read_dir(&config_dir)
        .map_err(|e| format!("Failed to read config directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let file_name = entry.file_name();
        let name = file_name.to_string_lossy();
        
        if name.ends_with("_.conf.enc") || name.ends_with("_.conf") {
            let config_name = name
                .trim_end_matches("_.conf.enc")
                .trim_end_matches("_.conf")
                .to_string();
            configs.push(config_name);
        }
    }

    Ok(configs)
}

pub async fn delete_config(config_name: &str) -> Result<String, String> {
    let config_dir = get_config_dir()?;
    
    let enc_path = config_dir.join(format!("{}_.conf.enc", config_name));
    let plain_path = config_dir.join(format!("{}_.conf", config_name));

    let mut deleted = false;
    
    if enc_path.exists() {
        fs::remove_file(&enc_path)
            .map_err(|e| format!("Failed to delete encrypted config: {}", e))?;
        deleted = true;
    }
    
    if plain_path.exists() {
        fs::remove_file(&plain_path)
            .map_err(|e| format!("Failed to delete config: {}", e))?;
        deleted = true;
    }

    if deleted {
        Ok(format!("Config '{}' deleted", config_name))
    } else {
        Err(format!("Config '{}' not found", config_name))
    }
}
