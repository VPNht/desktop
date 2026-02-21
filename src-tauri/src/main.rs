// Prevents additional console window on Windows in release mode
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod crypto;
mod killswitch;
mod vpn;
mod wireguard;

use std::sync::{Arc, Mutex};
use tauri::State;
use wireguard::{VpnStatus, WireGuardManager};
use killswitch::{KillSwitch, KillSwitchState};
use vpn::auto_reconnect::{AutoReconnectConfig, AutoReconnectManager, ReconnectState};

// App state that persists across commands
pub struct AppState {
    wg_manager: Arc<Mutex<WireGuardManager>>,
    killswitch: Arc<Mutex<Box<dyn KillSwitch>>>,
    auto_reconnect: Arc<Mutex<AutoReconnectManager>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            wg_manager: Arc::new(Mutex::new(WireGuardManager::new())),
            killswitch: Arc::new(Mutex::new(killswitch::create_killswitch())),
            auto_reconnect: Arc::new(Mutex::new(AutoReconnectManager::new(AutoReconnectConfig::default()))),
        }
    }
}

#[tauri::command]
async fn connect_vpn(
    config: String,
    config_name: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let manager = state.wg_manager.clone();
    let result = tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Handle::current();
        let manager = manager.lock().map_err(|e| e.to_string())?;
        rt.block_on(async { manager.connect(config, &config_name).await })
    })
    .await
    .map_err(|e| e.to_string())?;
    result
}

#[tauri::command]
async fn disconnect_vpn(state: State<'_, AppState>) -> Result<String, String> {
    let manager = state.wg_manager.clone();
    let result = tokio::task::spawn_blocking(move || {
        let rt = tokio::runtime::Handle::current();
        let manager = manager.lock().map_err(|e| e.to_string())?;
        rt.block_on(async { manager.disconnect().await })
    })
    .await
    .map_err(|e| e.to_string())?;
    result
}

#[tauri::command]
async fn get_vpn_status(state: State<'_, AppState>) -> Result<VpnStatus, String> {
    let manager = state.wg_manager.lock().map_err(|e| e.to_string())?;
    Ok(manager.get_status())
}

#[tauri::command]
async fn save_config(
    config_name: String,
    config_data: String,
    encryption_key: Option<String>,
) -> Result<String, String> {
    wireguard::save_config(&config_name, &config_data, encryption_key.as_deref()).await
}

#[tauri::command]
async fn load_config(
    config_name: String,
    encryption_key: Option<String>,
) -> Result<String, String> {
    wireguard::load_config(&config_name, encryption_key.as_deref()).await
}

#[tauri::command]
async fn list_configs() -> Result<Vec<String>, String> {
    wireguard::list_configs().await
}

#[tauri::command]
async fn delete_config(config_name: String) -> Result<String, String> {
    wireguard::delete_config(&config_name).await
}

#[tauri::command]
fn generate_encryption_key() -> String {
    crypto::generate_key()
}

#[tauri::command]
async fn enable_killswitch(
    vpn_interface: String,
    vpn_server_ip: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut ks = state.killswitch.lock().map_err(|e| e.to_string())?;
    ks.enable(&vpn_interface, &vpn_server_ip)?;
    Ok("Kill switch enabled".to_string())
}

#[tauri::command]
async fn disable_killswitch(state: State<'_, AppState>) -> Result<String, String> {
    let mut ks = state.killswitch.lock().map_err(|e| e.to_string())?;
    ks.disable()?;
    Ok("Kill switch disabled".to_string())
}

#[tauri::command]
async fn get_killswitch_state(state: State<'_, AppState>) -> Result<KillSwitchState, String> {
    let ks = state.killswitch.lock().map_err(|e| e.to_string())?;
    Ok(ks.state())
}

#[tauri::command]
async fn get_reconnect_state(state: State<'_, AppState>) -> Result<ReconnectState, String> {
    let mgr = state.auto_reconnect.lock().map_err(|e| e.to_string())?;
    Ok(mgr.state())
}

#[tauri::command]
async fn set_auto_reconnect(enabled: bool, state: State<'_, AppState>) -> Result<String, String> {
    let mut mgr = state.auto_reconnect.lock().map_err(|e| e.to_string())?;
    let mut config = AutoReconnectConfig::default();
    config.enabled = enabled;
    mgr.set_config(config);
    Ok(format!("Auto-reconnect {}", if enabled { "enabled" } else { "disabled" }))
}

#[tauri::command]
async fn cancel_reconnect(state: State<'_, AppState>) -> Result<String, String> {
    let mgr = state.auto_reconnect.lock().map_err(|e| e.to_string())?;
    mgr.cancel();
    Ok("Reconnect cancelled".to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect_vpn,
            disconnect_vpn,
            get_vpn_status,
            save_config,
            load_config,
            list_configs,
            delete_config,
            generate_encryption_key,
            enable_killswitch,
            disable_killswitch,
            get_killswitch_state,
            get_reconnect_state,
            set_auto_reconnect,
            cancel_reconnect,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
