use serde::{Deserialize, Serialize};

mod killswitch;
pub use killswitch::{enable_killswitch, disable_killswitch};
use std::sync::Arc;
use tauri::{command, State};
use tokio::sync::Mutex;

use crate::config::{Server, WireGuardConfig, generate_wireguard_config};
use crate::error::Result;
use crate::storage::SecureStorage;
use crate::vpn::{ConnectionManager, ConnectionStatus};

// Auth Types
#[derive(Debug, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignupRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub user: User,
    pub tokens: AuthTokens,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: String,
    pub subscription: Subscription,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Subscription {
    pub plan: String,
    pub expires_at: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: i64,
}

// Auth Commands
#[command]
pub async fn auth_login(
    email: String,
    password: String,
    storage: State<'_, SecureStorage>,
) -> Result<AuthResponse> {
    // In a real implementation, this would call the VPNht API
    // For now, we'll return a mock response

    // Validate credentials (mock)
    if email.is_empty() || password.len() < 8 {
        return Err("Invalid credentials".into());
    }

    let user = User {
        id: "user_123".to_string(),
        email: email.clone(),
        subscription: Subscription {
            plan: "premium".to_string(),
            expires_at: "2025-12-31".to_string(),
            is_active: true,
        },
    };

    let tokens = AuthTokens {
        access_token: format!("mock_token_{}", uuid::Uuid::new_v4()),
        refresh_token: format!("mock_refresh_{}", uuid::Uuid::new_v4()),
        expires_at: chrono::Utc::now().timestamp() + 3600,
    };

    // Store tokens securely
    storage.store("auth_tokens", &tokens).await?;
    storage.store("user", &user).await?;

    Ok(AuthResponse { user, tokens })
}

#[command]
pub async fn auth_signup(
    email: String,
    password: String,
    storage: State<'_, SecureStorage>,
) -> Result<AuthResponse> {
    // Validate password strength
    if password.len() < 8 {
        return Err("Password must be at least 8 characters".into());
    }

    // Register user (mock)
    let user = User {
        id: format!("user_{}", uuid::Uuid::new_v4()),
        email: email.clone(),
        subscription: Subscription {
            plan: "free".to_string(),
            expires_at: "2099-12-31".to_string(),
            is_active: true,
        },
    };

    let tokens = AuthTokens {
        access_token: format!("mock_token_{}", uuid::Uuid::new_v4()),
        refresh_token: format!("mock_refresh_{}", uuid::Uuid::new_v4()),
        expires_at: chrono::Utc::now().timestamp() + 3600,
    };

    // Store tokens securely
    storage.store("auth_tokens", &tokens).await?;
    storage.store("user", &user).await?;

    Ok(AuthResponse { user, tokens })
}

#[command]
pub async fn auth_logout(storage: State<'_, SecureStorage>) -> Result<()> {
    storage.delete("auth_tokens").await?;
    storage.delete("user").await?;
    Ok(())
}

// Server Commands
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ServerData {
    pub id: String,
    pub name: String,
    pub country: String,
    pub country_code: String,
    pub city: String,
    pub lat: f64,
    pub lng: f64,
    pub hostname: String,
    pub ip: String,
    pub port: u16,
    pub public_key: String,
    pub supported_protocols: Vec<String>,
    pub features: Vec<String>,
    pub latency: Option<u32>,
    pub load: Option<u32>,
    pub is_premium: bool,
}

#[command]
pub async fn fetch_servers() -> Result<Vec<ServerData>> {
    // In a real implementation, this would fetch from the VPNht GraphQL API
    // For now, return mock data
    let servers = get_mock_servers();
    Ok(servers)
}

fn get_mock_servers() -> Vec<ServerData> {
    vec![
        // North America
        ServerData {
            id: "us-nyc".to_string(),
            name: "New York".to_string(),
            country: "United States".to_string(),
            country_code: "US".to_string(),
            city: "New York".to_string(),
            lat: 40.7128,
            lng: -74.0060,
            hostname: "us-nyc.vpnht.com".to_string(),
            ip: "192.168.1.1".to_string(),
            port: 443,
            public_key: "abc123PLACEHOLDER".to_string(),
            supported_protocols: vec!["wireguard".to_string(), "openvpn_udp".to_string()],
            features: vec!["p2p".to_string(), "streaming".to_string()],
            latency: Some(25),
            load: Some(45),
            is_premium: false,
        },
        ServerData {
            id: "uk-lon".to_string(),
            name: "London".to_string(),
            country: "United Kingdom".to_string(),
            country_code: "GB".to_string(),
            city: "London".to_string(),
            lat: 51.5074,
            lng: -0.1278,
            hostname: "uk-lon.vpnht.com".to_string(),
            ip: "192.168.2.1".to_string(),
            port: 443,
            public_key: "def456PLACEHOLDER".to_string(),
            supported_protocols: vec!["wireguard".to_string(), "openvpn_udp".to_string(), "openvpn_tcp".to_string()],
            features: vec!["p2p".to_string(), "streaming".to_string()],
            latency: Some(35),
            load: Some(58),
            is_premium: false,
        },
        ServerData {
            id: "de-fra".to_string(),
            name: "Frankfurt".to_string(),
            country: "Germany".to_string(),
            country_code: "DE".to_string(),
            city: "Frankfurt".to_string(),
            lat: 50.1109,
            lng: 8.6821,
            hostname: "de-fra.vpnht.com".to_string(),
            ip: "192.168.2.4".to_string(),
            port: 443,
            public_key: "ghi789PLACEHOLDER".to_string(),
            supported_protocols: vec!["wireguard".to_string(), "openvpn_udp".to_string(), "openvpn_tcp".to_string()],
            features: vec!["p2p".to_string(), "streaming".to_string()],
            latency: Some(30),
            load: Some(71),
            is_premium: false,
        },
        ServerData {
            id: "sg-sin".to_string(),
            name: "Singapore".to_string(),
            country: "Singapore".to_string(),
            country_code: "SG".to_string(),
            city: "Singapore".to_string(),
            lat: 1.3521,
            lng: 103.8198,
            hostname: "sg-sin.vpnht.com".to_string(),
            ip: "192.168.3.3".to_string(),
            port: 443,
            public_key: "jkl012PLACEHOLDER".to_string(),
            supported_protocols: vec!["wireguard".to_string(), "openvpn_udp".to_string(), "openvpn_tcp".to_string()],
            features: vec!["p2p".to_string(), "streaming".to_string()],
            latency: Some(85),
            load: Some(72),
            is_premium: false,
        },
        ServerData {
            id: "jp-tok".to_string(),
            name: "Tokyo".to_string(),
            country: "Japan".to_string(),
            country_code: "JP".to_string(),
            city: "Tokyo".to_string(),
            lat: 35.6762,
            lng: 139.6503,
            hostname: "jp-tok.vpnht.com".to_string(),
            ip: "192.168.3.1".to_string(),
            port: 443,
            public_key: "mno345PLACEHOLDER".to_string(),
            supported_protocols: vec!["wireguard".to_string(), "openvpn_udp".to_string()],
            features: vec!["p2p".to_string(), "streaming".to_string()],
            latency: Some(92),
            load: Some(68),
            is_premium: false,
        },
    ]
}

// Latency Commands
#[derive(Debug, Serialize, Deserialize)]
pub struct LatencyResult {
    pub server_id: String,
    pub latency: Option<u32>,
}

#[command]
pub async fn measure_latency(server_id: String) -> Result<LatencyResult> {
    // Simulate latency measurement
    // In real implementation, use ICMP ping
    use tokio::time::{sleep, Duration};
    sleep(Duration::from_millis(100)).await;

    let latency = rand::random::<u32>() % 150 + 10;

    Ok(LatencyResult {
        server_id,
        latency: Some(latency),
    })
}

#[command]
pub async fn measure_latencies(server_ids: Vec<String>) -> Result<Vec<LatencyResult>> {
    let mut results = Vec::new();

    for server_id in server_ids {
        let result = measure_latency(server_id).await?;
        results.push(result);
        // Small delay between pings
        tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
    }

    Ok(results)
}

// IP Info Commands
#[derive(Debug, Serialize, Deserialize)]
pub struct IPInfo {
    pub ip: String,
    pub country: String,
    pub city: String,
    pub isp: String,
    pub is_vpn: bool,
}

#[command]
pub async fn get_ip_info() -> Result<IPInfo> {
    // In real implementation, call an IP info API
    Ok(IPInfo {
        ip: "203.0.113.1".to_string(),
        country: "United States".to_string(),
        city: "New York".to_string(),
        isp: "VPNht".to_string(),
        is_vpn: true,
    })
}

// VPN Commands
#[command]
pub async fn vpn_connect(
    server_id: String,
    manager: State<'_, Arc<Mutex<ConnectionManager>>>,
) -> Result<()> {
    let mut manager = manager.lock().await;
    manager.connect(&server_id).await?;
    Ok(())
}

#[command]
pub async fn vpn_disconnect(
    manager: State<'_, Arc<Mutex<ConnectionManager>>>,
) -> Result<()> {
    let mut manager = manager.lock().await;
    manager.disconnect().await?;
    Ok(())
}

#[command]
pub async fn get_connection_status(
    manager: State<'_, Arc<Mutex<ConnectionManager>>>,
) -> Result<ConnectionStatus> {
    let manager = manager.lock().await;
    Ok(manager.get_status().await)
}

// WireGuard Config Commands
#[command]
pub fn gen_wireguard_config(server_id: String) -> Result<WireGuardConfig> {
    // Generate a new WireGuard config
    let config = generate_wireguard_config(&server_id)?;
    Ok(config)
}

#[command]
pub fn validate_wireguard_config(config: WireGuardConfig) -> Result<bool> {
    // Validate the WireGuard configuration
    if config.interface.private_key.is_empty() {
        return Ok(false);
    }
    if config.peer.public_key.is_empty() {
        return Ok(false);
    }
    if config.peer.endpoint.is_empty() {
        return Ok(false);
    }
    Ok(true)
}

// Secure Storage Commands
#[command]
pub async fn store_secure(
    key: String,
    value: String,
    storage: State<'_, SecureStorage>,
) -> Result<()> {
    storage.store_raw(&key, &value).await?;
    Ok(())
}

#[command]
pub async fn retrieve_secure(
    key: String,
    storage: State<'_, SecureStorage>,
) -> Result<Option<String>> {
    let value = storage.retrieve_raw(&key).await?;
    Ok(value)
}

#[command]
pub async fn delete_secure(
    key: String,
    storage: State<'_, SecureStorage>,
) -> Result<()> {
    storage.delete(&key).await?;
    Ok(())
}
