mod commands;
mod config;
mod error;
mod killswitch;
mod storage;
mod vpn;

use killswitch::KillSwitch;
use tracing::{info, warn};

use std::sync::Arc;
use tauri::{
    Builder, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, generate_context, generate_handler,
};
use tokio::sync::Mutex;
use vpn::ConnectionManager;

fn main() {
    // System tray setup
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let open = CustomMenuItem::new("open".to_string(), "Open");
    let tray_menu = SystemTrayMenu::new()
        .add_item(open)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);

    let system_tray = SystemTray::new().with_menu(tray_menu);

    Builder::default()
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| {
            match event {
                SystemTrayEvent::LeftClick {
                    position: _,
                    size: _,
                    ..
                } => {
                    let window = app.get_window("main").unwrap();
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        "open" => {
                            let window = app.get_window("main").unwrap();
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .on_window_event(|event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event.event() {
                // Hide window instead of closing if minimize to tray is enabled
                let window = event.window();
                window.hide().unwrap();
                api.prevent_close();
            }
        })
        .invoke_handler(generate_handler![
            commands::auth_login,
            commands::auth_signup,
            commands::auth_logout,
            commands::fetch_servers,
            commands::measure_latency,
            commands::measure_latencies,
            commands::get_ip_info,
            commands::vpn_connect,
            commands::vpn_disconnect,
            commands::get_connection_status,
            commands::gen_wireguard_config,
            commands::validate_wireguard_config,
            commands::store_secure,
            commands::retrieve_secure,
            commands::delete_secure,
            commands::enable_killswitch,
            commands::disable_killswitch,
        ])
        .setup(|app| {
            // Initialize logging
            #[cfg(not(debug_assertions))]
            {
                if let Err(e) = logging::init_logging(app) {
                    eprintln!("Failed to initialize logging: {}", e);
                }
            }
            
            // Initialize secure storage
            storage::init_secure_storage(app)?;
            
            // Initialize Kill Switch
            let mut killswitch = KillSwitch::new();
            if let Err(e) = killswitch.enable() {
                warn!("Failed to enable Kill Switch: {}", e);
            }
            app.manage(killswitch);
            
            // Register ConnectionManager as managed state
            app.manage(Arc::new(Mutex::new(ConnectionManager::new())));
            Ok(())
        })
        .run(generate_context!())
        .expect("error while running tauri application");
}
