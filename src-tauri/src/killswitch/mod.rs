//! Kill Switch module — blocks all non-VPN traffic when enabled.
//!
//! Platform-specific implementations live in sub-modules gated by `cfg`.

#[cfg(target_os = "windows")]
pub mod windows;

#[cfg(target_os = "macos")]
pub mod macos;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum KillSwitchState {
    Disabled,
    Enabled,
    Error(String),
}

/// Cross-platform kill switch trait.
pub trait KillSwitch: Send + Sync {
    /// Enable the kill switch, blocking all traffic except through `vpn_interface`.
    fn enable(&mut self, vpn_interface: &str, vpn_server_ip: &str) -> Result<(), String>;
    /// Disable the kill switch and restore normal networking.
    fn disable(&mut self) -> Result<(), String>;
    /// Get current state.
    fn state(&self) -> KillSwitchState;
}

/// Create the platform-appropriate kill switch implementation.
pub fn create_killswitch() -> Box<dyn KillSwitch> {
    #[cfg(target_os = "windows")]
    {
        Box::new(windows::WfpKillSwitch::new())
    }
    #[cfg(target_os = "macos")]
    {
        Box::new(macos::PfKillSwitch::new())
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos")))]
    {
        Box::new(NoopKillSwitch)
    }
}

/// Fallback no-op implementation for unsupported platforms.
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
struct NoopKillSwitch;

#[cfg(not(any(target_os = "windows", target_os = "macos")))]
impl KillSwitch for NoopKillSwitch {
    fn enable(&mut self, _: &str, _: &str) -> Result<(), String> {
        Err("Kill switch not supported on this platform".into())
    }
    fn disable(&mut self) -> Result<(), String> {
        Ok(())
    }
    fn state(&self) -> KillSwitchState {
        KillSwitchState::Disabled
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_killswitch() {
        let ks = create_killswitch();
        assert_eq!(ks.state(), KillSwitchState::Disabled);
    }
}
