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

// Storage key allowlist
const ALLOWED_STORAGE_KEYS: &[&str] = &[
    "auth_tokens",
    "user", 
    "vpn_config",
    "wireguard_private_key",
    "app_settings",
];

fn validate_storage_key(key: &str) -> Result<()> {
    if ALLOWED_STORAGE_KEYS.contains(&key) {
        Ok(())
    } else {
        Err(AppError::Storage(format!("Storage key '{}' is not permitted", key)))
    }
}

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

// Input validation helper functions
fn validate_email(email: &str) -> Result<()> {
    if !email.contains('@') || email.len() < 5 || email.len() > 254 {
        return Err(AppError::Auth("Invalid email address".into()));
    }
    // Additional email format validation
    let parts: Vec<&str> = email.split('@').collect();
    if parts.len() != 2 || parts[0].is_empty() || parts[1].is_empty() {
        return Err(AppError::Auth("Invalid email format".into()));
    }
    if parts[1].chars().filter(|&c| c == '.').count() == 0 {
        return Err(AppError::Auth("Invalid email domain".into()));
    }
    Ok(())
}

fn validate_password(password: &str) -> Result<()> {
    if password.len() < 8 || password.len() > 128 {
        return Err(AppError::Auth("Password must be between 8 and 128 characters".into()));
    }
    Ok(())
}

fn validate_server_id(server_id: &str) -> Result<()> {
    if server_id.len() > 64 || !server_id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err(AppError::Config("Invalid server ID".into()));
    }
    Ok(())
}

// Auth Commands
#[command]
pub async fn auth_login(
    email: String,
    password: String,
    storage: State<'_, SecureStorage>,
) -> Result<AuthResponse> {
    // Validate inputs
    validate_email(&email)?;
    validate_password(&password)?;
    
    // In a real implementation, this would call the VPNht API
    // For now, we'll return a mock response
    
    // Validate credentials (mock)
    if email.is_empty() {
        return Err(AppError::Auth("Invalid credentials".into()));
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

    // Store tokens securely with validation
    validate_storage_key("auth_tokens")?;
    validate_storage_key("user")?;
    storage.store("auth_tokens", &tokens).await?;
    storage.store("user", &user).await?;

    Ok(AuthResponse { user, tokens })
}

#[command]
pub async fn auth_signup(
    email: String,
    password: String,
    storage: State<'_, SecureStorage>,
    api_client: State<'_, Arc<ApiClient>>,
) -> Result<AuthResponse> {
    // Validate inputs
    validate_email(&email)?;
    if password.len() < 8 {
        return Err(AppError::Auth("Password must be at least 8 characters".into()));
    }
    
    let (api_user, api_tokens) = api_client.signup(&email, &password).await?;
    
    let user = User {
        id: api_user.id,
        email: api_user.email,
        subscription: Subscription {
            plan: api_user.subscription.plan,
            expires_at: api_user.subscription.expires_at,
            is_active: api_user.subscription.is_active,
        },
    };

    let tokens = AuthTokens {
        access_token: api_tokens.access_token,
        refresh_token: api_tokens.refresh_token,
        expires_at: api_tokens.expires_at,
    };

    // Store tokens securely with validation
    validate_storage_key("auth_tokens")?;
    validate_storage_key("user")?;
    storage.store("auth_tokens", &tokens).await?;
    storage.store("user", &user).await?;

    Ok(AuthResponse { user, tokens })
}

#[command]
pub async fn auth_logout(
    storage: State<'_, SecureStorage>,
    api_client: State<'_, Arc<ApiClient>>,
) -> Result<()> {
    validate_storage_key("auth_tokens")?;
    validate_storage_key("user")?;
    storage.delete("auth_tokens").await?;
    storage.delete("user").await?;
    api_client.clear_tokens().await;
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
pub async fn fetch_servers(
    api_client: State<'_, Arc<ApiClient>>,
) -> Result<Vec<ServerData>> {
    let api_servers = api_client.fetch_servers().await?;
    
    let servers = api_servers.into_iter().map(|server| ServerData {
        id: server.id,
        name: server.name,
        country: server.country,
        country_code: server.country_code,
        city: server.city,
        lat: server.lat,
        lng: server.lng,
        hostname: server.hostname,
        ip: server.ip,
        port: server.port,
        public_key: server.public_key,
        supported_protocols: server.supported_protocols,
        features: server.features,
        latency: None,
        load: server.load,
        is_premium: server.is_premium,
    }).collect();
    
    Ok(servers)
}

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
    // Validate server_id
    validate_server_id(&server_id)?;
    
    // Use the real latency measurement function
    let latency = measure_tcp_latency(&server_id).await?;

    Ok(LatencyResult {
        server_id,
        latency,
}

#[command]
pub async fn measure_latencies(server_ids: Vec<String>) -> Result<Vec<LatencyResult>> {
    // Limit batch size to prevent DoS
    if server_ids.len() > 100 {
        return Err(AppError::Network("Too many servers for latency measurement (max 100)".into()));
    }
    
    for server_id in &server_ids {
        validate_server_id(server_id)?;
    }
    
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
pub async fn get_ip_info(
    api_client: State<'_, Arc<ApiClient>>,
) -> Result<IPInfo> {
    let ip_info = api_client.get_ip_info().await?;
    
    Ok(IPInfo {
        ip: ip_info.ip,
        country: ip_info.country,
        city: ip_info.city,
        isp: ip_info.org,
        is_vpn: ip_info.org.to_lowercase().contains("vpn") || 
               ip_info.org.to_lowercase().contains("vpnht"),
    })
}

// VPN Commands
#[command]
pub async fn vpn_connect(
    server_id: String,
    manager: State<'_, Arc<Mutex<ConnectionManager>>>,
) -> Result<()> {
    // Validate server_id
    validate_server_id(&server_id)?;
    
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
    // Validate server_id
    validate_server_id(&server_id)?;
    
    // Generate a new WireGuard config
    let config = generate_wireguard_config(&server_id)?;
    Ok(config)
}

#[command]
pub fn validate_wireguard_config(config: WireGuardConfig) -> Result<bool> {
    // Validate the WireGuard configuration
    if config.interface.private_key.is_empty() || config.interface.private_key.len() > 256 {
        return Ok(false);
    }
    if config.peer.public_key.is_empty() || config.peer.public_key.len() > 256 {
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
    validate_storage_key(&key)?;
    storage.store_raw(&key, &value).await?;
    Ok(())
}

#[command]
pub async fn retrieve_secure(
    key: String,
    storage: State<'_, SecureStorage>,
) -> Result<Option<String>> {
    validate_storage_key(&key)?;
    let value = storage.retrieve_raw(&key).await?;
    Ok(value)
}

#[command]
pub async fn delete_secure(
    key: String,
    storage: State<'_, SecureStorage>,
) -> Result<()> {
    validate_storage_key(&key)?;
    storage.delete(&key).await?;
    Ok(())
}