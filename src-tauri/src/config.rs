use crate::error::Result;
use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct WireGuardConfig {
    pub interface: InterfaceConfig,
    pub peer: PeerConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InterfaceConfig {
    pub private_key: String,
    pub addresses: Vec<String>,
    pub dns: Vec<String>,
    pub mtu: Option<u16>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PeerConfig {
    pub public_key: String,
    pub allowed_ips: Vec<String>,
    pub endpoint: String,
    pub persistent_keepalive: u32,
}

impl WireGuardConfig {
    /// Generate wg-quick compatible configuration file content
    pub fn to_wg_quick_format(&self) -> String {
        let mut output = String::new();

        // Interface section
        output.push_str("[Interface]\n");
        output.push_str(&format!("PrivateKey = {}\n", self.interface.private_key));

        for addr in &self.interface.addresses {
            output.push_str(&format!("Address = {}\n", addr));
        }

        for dns in &self.interface.dns {
            output.push_str(&format!("DNS = {}\n", dns));
        }

        if let Some(mtu) = self.interface.mtu {
            output.push_str(&format!("MTU = {}\n", mtu));
        }

        output.push_str("\n");

        // Peer section
        output.push_str("[Peer]\n");
        output.push_str(&format!("PublicKey = {}\n", self.peer.public_key));

        for allowed_ip in &self.peer.allowed_ips {
            output.push_str(&format!("AllowedIPs = {}\n", allowed_ip));
        }

        output.push_str(&format!("Endpoint = {}\n", self.peer.endpoint));

        if self.peer.persistent_keepalive > 0 {
            output.push_str(&format!(
                "PersistentKeepalive = {}\n",
                self.peer.persistent_keepalive
            ));
        }

        output
    }

    /// Generate Windows WireGuard service configuration
    pub fn to_windows_format(&self) -> String {
        self.to_wg_quick_format()
    }

    /// Validate the configuration
    pub fn validate(&self) -> Result<()> {
        // Validate interface
        if self.interface.private_key.is_empty() {
            return Err("Private key is required".to_string());
        }

        if self.interface.addresses.is_empty() {
            return Err("At least one address is required".to_string());
        }

        // Validate peer
        if self.peer.public_key.is_empty() {
            return Err("Peer public key is required".to_string());
        }

        if self.peer.endpoint.is_empty() {
            return Err("Peer endpoint is required".to_string());
        }

        // Validate endpoint format (host:port)
        if !self.peer.endpoint.contains(':') {
            return Err("Invalid endpoint format, expected host:port".to_string());
        }

        Ok(())
    }
}

/// Generate a new WireGuard keypair
pub fn generate_keypair() -> Result<(String, String)> {
    // Try to use wg genkey/wg pubkey
    generate_keypair_native().map_err(|e| {
        format!("Failed to generate WireGuard keypair: {}. Ensure `wg` tools are installed.", e)
    })
}

fn generate_keypair_native() -> Result<(String, String)> {
    // Generate private key
    let private_output = Command::new("wg")
        .arg("genkey")
        .output()
        .map_err(|e| format!("Failed to run wg genkey: {}", e))?;

    if !private_output.status.success() {
        return Err("wg genkey failed".to_string());
    }

    let private_key = String::from_utf8_lossy(&private_output.stdout)
        .trim()
        .to_string();

    // Generate public key from private key
    let mut child = Command::new("wg")
        .arg("pubkey")
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to run wg pubkey: {}", e))?;

    use std::io::Write;
    if let Some(ref mut stdin) = child.stdin {
        stdin.write_all(private_key.as_bytes())
            .map_err(|e| format!("Failed to write to wg pubkey: {}", e))?;
    }

    let output = child.wait_with_output()
        .map_err(|e| format!("Failed to get output from wg pubkey: {}", e))?;

    if !output.status.success() {
        return Err("wg pubkey failed".to_string());
    }

    let public_key = String::from_utf8_lossy(&output.stdout)
        .trim()
        .to_string();

    Ok((private_key, public_key))
}

fn generate_keypair_fallback() -> Result<(String, String)> {
    // This is a fallback that requires the "wireguard-" crate
    // In a real implementation, you'd use the wireguard- crate
    // For now, return placeholder keys
    // TODO: Implement proper key generation without external tool
    Err("WireGuard tools not available".to_string())
}

/// Server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    pub id: String,
    pub hostname: String,
    pub ip: String,
    pub port: u16,
    pub public_key: String,
}

/// Generate a WireGuard configuration for a given server
pub fn generate_wireguard_config(server_id: &str) -> Result<WireGuardConfig> {
    // Generate client keypair
    let (private_key, _public_key) = generate_keypair()?;

    // Server public key (would come from API)
    let server_public_key = "SERVER_PUBLIC_KEY_PLACEHOLDER".to_string();

    // Build configuration
    let config = WireGuardConfig {
        interface: InterfaceConfig {
            private_key,
            addresses: vec!["10.200.200.2/32".to_string()],
            dns: vec!["10.200.200.1".to_string()],
            mtu: Some(1420),
        },
        peer: PeerConfig {
            public_key: server_public_key,
            allowed_ips: vec![
                "0.0.0.0/0".to_string(),    // All IPv4 traffic
                "::/0".to_string(),          // All IPv6 traffic
            ],
            endpoint: format!("{}.vpnht.com:443", server_id),
            persistent_keepalive: 25,
        },
    };

    // Validate configuration
    config.validate()?;

    Ok(config)
}

/// Parse a WireGuard configuration file
pub fn parse_wireguard_config(config_str: &str) -> Result<WireGuardConfig> {
    let mut interface_config: Option<InterfaceConfig> = None;
    let mut peer_config: Option<PeerConfig> = None;

    let mut current_section: Option<&str> = None;

    let mut private_key = String::new();
    let mut addresses: Vec<String> = Vec::new();
    let mut dns: Vec<String> = Vec::new();
    let mut mtu: Option<u16> = None;

    let mut public_key = String::new();
    let mut allowed_ips: Vec<String> = Vec::new();
    let mut endpoint = String::new();
    let mut persistent_keepalive: u32 = 0;

    for line in config_str.lines() {
        let line = line.trim();

        // Skip empty lines and comments
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        // Parse section headers
        if line.starts_with('[') && line.ends_with(']') {
            // Save previous section
            if current_section == Some("Interface") {
                interface_config = Some(InterfaceConfig {
                    private_key: private_key.clone(),
                    addresses: addresses.clone(),
                    dns: dns.clone(),
                    mtu,
                });
            } else if current_section == Some("Peer") {
                peer_config = Some(PeerConfig {
                    public_key: public_key.clone(),
                    allowed_ips: allowed_ips.clone(),
                    endpoint: endpoint.clone(),
                    persistent_keepalive,
                });
            }

            current_section = Some(&line[1..line.len()-1]);
            continue;
        }

        // Parse key-value pairs
        if let Some(pos) = line.find('=') {
            let key = line[..pos].trim();
            let value = line[pos+1..].trim();

            match current_section {
                Some("Interface") => {
                    match key {
                        "PrivateKey" => private_key = value.to_string(),
                        "Address" => addresses.push(value.to_string()),
                        "DNS" => dns.push(value.to_string()),
                        "MTU" => mtu = value.parse().ok(),
                        _ => {}
                    }
                }
                Some("Peer") => {
                    match key {
                        "PublicKey" => public_key = value.to_string(),
                        "AllowedIPs" => {
                            for ip in value.split(',') {
                                allowed_ips.push(ip.trim().to_string());
                            }
                        }
                        "Endpoint" => endpoint = value.to_string(),
                        "PersistentKeepalive" => {
                            persistent_keepalive = value.parse().unwrap_or(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        }
    }

    // Save last section
    if current_section == Some("Interface") {
        interface_config = Some(InterfaceConfig {
            private_key,
            addresses,
            dns,
            mtu,
        });
    } else if current_section == Some("Peer") {
        peer_config = Some(PeerConfig {
            public_key,
            allowed_ips,
            endpoint,
            persistent_keepalive,
        });
    }

    match (interface_config, peer_config) {
        (Some(interface), Some(peer)) => {
            Ok(WireGuardConfig { interface, peer })
        }
        _ => Err("Invalid WireGuard configuration file".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wg_quick_format() {
        let config = WireGuardConfig {
            interface: InterfaceConfig {
                private_key: "test_private_key".to_string(),
                addresses: vec!["10.200.200.2/32".to_string()],
                dns: vec!["10.200.200.1".to_string()],
                mtu: Some(1420),
            },
            peer: PeerConfig {
                public_key: "test_public_key".to_string(),
                allowed_ips: vec!["0.0.0.0/0".to_string()],
                endpoint: "example.com:443".to_string(),
                persistent_keepalive: 25,
            },
        };

        let output = config.to_wg_quick_format();
        assert!(output.contains("[Interface]"));
        assert!(output.contains("PrivateKey = test_private_key"));
        assert!(output.contains("[Peer]"));
        assert!(output.contains("PublicKey = test_public_key"));
    }

    #[test]
    fn test_parse_wireguard_config() {
        let config_str = r#"
[Interface]
PrivateKey = test_private_key
Address = 10.200.200.2/32
DNS = 10.200.200.1
MTU = 1420

[Peer]
PublicKey = test_public_key
AllowedIPs = 0.0.0.0/0
Endpoint = example.com:443
PersistentKeepalive = 25
"#;

        let config = parse_wireguard_config(config_str).unwrap();
        assert_eq!(config.interface.private_key, "test_private_key");
        assert_eq!(config.peer.public_key, "test_public_key");
    }
}
