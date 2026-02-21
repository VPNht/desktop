use crate::killswitch::KillSwitch;
use tauri::Manager;

#[tauri::command]
pub fn enable_killswitch(app: tauri::AppHandle) -> Result<(), String> {
    let killswitch = app.state::<KillSwitch>();
    killswitch.enable()
}

#[tauri::command]
pub fn disable_killswitch(app: tauri::AppHandle) -> Result<(), String> {
    let killswitch = app.state::<KillSwitch>();
    killswitch.disable()
}