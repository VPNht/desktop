//! Auto-reconnect module for VPN connections.
//!
//! Monitors VPN connection state and automatically reconnects with exponential backoff
//! when an unexpected disconnect is detected.

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::watch;
use tokio::time::sleep;

/// Configuration for auto-reconnect behavior.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutoReconnectConfig {
    /// Whether auto-reconnect is enabled.
    pub enabled: bool,
    /// Initial delay before first reconnect attempt (milliseconds).
    pub initial_delay_ms: u64,
    /// Maximum delay between attempts (milliseconds).
    pub max_delay_ms: u64,
    /// Maximum number of reconnect attempts (0 = unlimited).
    pub max_attempts: u32,
    /// Backoff multiplier.
    pub backoff_factor: f64,
}

impl Default for AutoReconnectConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            initial_delay_ms: 1000,
            max_delay_ms: 60000,
            max_attempts: 10,
            backoff_factor: 2.0,
        }
    }
}

/// Current state of the auto-reconnect system.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ReconnectState {
    Idle,
    Monitoring,
    Reconnecting { attempt: u32, next_delay_ms: u64 },
    Failed { attempts: u32, last_error: String },
    Disabled,
}

/// Auto-reconnect manager.
///
/// Spawns a background task that monitors VPN status and triggers reconnection.
pub struct AutoReconnectManager {
    config: AutoReconnectConfig,
    state_tx: watch::Sender<ReconnectState>,
    state_rx: watch::Receiver<ReconnectState>,
    cancel: Arc<AtomicBool>,
}

impl AutoReconnectManager {
    pub fn new(config: AutoReconnectConfig) -> Self {
        let initial = if config.enabled {
            ReconnectState::Idle
        } else {
            ReconnectState::Disabled
        };
        let (state_tx, state_rx) = watch::channel(initial);

        Self {
            config,
            state_tx,
            state_rx,
            cancel: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Get current reconnect state.
    pub fn state(&self) -> ReconnectState {
        self.state_rx.borrow().clone()
    }

    /// Update configuration.
    pub fn set_config(&mut self, config: AutoReconnectConfig) {
        let was_enabled = self.config.enabled;
        self.config = config;

        if !self.config.enabled {
            self.cancel.store(true, Ordering::SeqCst);
            let _ = self.state_tx.send(ReconnectState::Disabled);
        } else if !was_enabled {
            self.cancel.store(false, Ordering::SeqCst);
            let _ = self.state_tx.send(ReconnectState::Idle);
        }
    }

    /// Called when VPN connection is established.
    pub fn on_connected(&self) {
        if self.config.enabled {
            info!("Auto-reconnect: VPN connected, now monitoring");
            self.cancel.store(false, Ordering::SeqCst);
            let _ = self.state_tx.send(ReconnectState::Monitoring);
        }
    }

    /// Called when VPN is intentionally disconnected by user.
    pub fn on_user_disconnect(&self) {
        info!("Auto-reconnect: User-initiated disconnect, going idle");
        self.cancel.store(true, Ordering::SeqCst);
        let _ = self.state_tx.send(ReconnectState::Idle);
    }

    /// Called when VPN unexpectedly disconnects. Returns a reconnect task future.
    /// The caller should invoke the returned `connect_fn` when this signals.
    pub async fn on_unexpected_disconnect<F, Fut>(&self, connect_fn: F)
    where
        F: Fn() -> Fut + Send + Sync + 'static,
        Fut: std::future::Future<Output = Result<(), String>> + Send,
    {
        if !self.config.enabled {
            return;
        }

        warn!("Auto-reconnect: Unexpected disconnect detected, starting reconnection");

        let mut delay_ms = self.config.initial_delay_ms;
        let max_attempts = if self.config.max_attempts == 0 {
            u32::MAX
        } else {
            self.config.max_attempts
        };

        for attempt in 1..=max_attempts {
            if self.cancel.load(Ordering::SeqCst) {
                info!("Auto-reconnect: Cancelled");
                let _ = self.state_tx.send(ReconnectState::Idle);
                return;
            }

            let _ = self.state_tx.send(ReconnectState::Reconnecting {
                attempt,
                next_delay_ms: delay_ms,
            });

            info!(
                "Auto-reconnect: Attempt {}/{} (delay: {}ms)",
                attempt, max_attempts, delay_ms
            );

            sleep(Duration::from_millis(delay_ms)).await;

            if self.cancel.load(Ordering::SeqCst) {
                let _ = self.state_tx.send(ReconnectState::Idle);
                return;
            }

            match connect_fn().await {
                Ok(()) => {
                    info!("Auto-reconnect: Successfully reconnected on attempt {}", attempt);
                    let _ = self.state_tx.send(ReconnectState::Monitoring);
                    return;
                }
                Err(e) => {
                    error!("Auto-reconnect: Attempt {} failed: {}", attempt, e);
                    // Exponential backoff
                    delay_ms = ((delay_ms as f64) * self.config.backoff_factor) as u64;
                    delay_ms = delay_ms.min(self.config.max_delay_ms);
                }
            }
        }

        error!("Auto-reconnect: All {} attempts exhausted", max_attempts);
        let _ = self.state_tx.send(ReconnectState::Failed {
            attempts: max_attempts,
            last_error: "Max reconnect attempts reached".to_string(),
        });
    }

    /// Cancel any ongoing reconnection attempts.
    pub fn cancel(&self) {
        self.cancel.store(true, Ordering::SeqCst);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = AutoReconnectConfig::default();
        assert!(config.enabled);
        assert_eq!(config.initial_delay_ms, 1000);
        assert_eq!(config.max_delay_ms, 60000);
        assert_eq!(config.max_attempts, 10);
        assert_eq!(config.backoff_factor, 2.0);
    }

    #[test]
    fn test_manager_initial_state() {
        let manager = AutoReconnectManager::new(AutoReconnectConfig::default());
        match manager.state() {
            ReconnectState::Idle => {}
            _ => panic!("Expected Idle state"),
        }
    }

    #[test]
    fn test_disabled_manager() {
        let config = AutoReconnectConfig {
            enabled: false,
            ..Default::default()
        };
        let manager = AutoReconnectManager::new(config);
        match manager.state() {
            ReconnectState::Disabled => {}
            _ => panic!("Expected Disabled state"),
        }
    }

    #[test]
    fn test_on_connected() {
        let manager = AutoReconnectManager::new(AutoReconnectConfig::default());
        manager.on_connected();
        match manager.state() {
            ReconnectState::Monitoring => {}
            _ => panic!("Expected Monitoring state"),
        }
    }

    #[test]
    fn test_on_user_disconnect() {
        let manager = AutoReconnectManager::new(AutoReconnectConfig::default());
        manager.on_connected();
        manager.on_user_disconnect();
        match manager.state() {
            ReconnectState::Idle => {}
            _ => panic!("Expected Idle state"),
        }
    }

    #[tokio::test]
    async fn test_cancel_reconnect() {
        let manager = AutoReconnectManager::new(AutoReconnectConfig {
            initial_delay_ms: 100,
            max_attempts: 3,
            ..Default::default()
        });

        manager.on_connected();
        manager.cancel();

        manager
            .on_unexpected_disconnect(|| async { Err("test".to_string()) })
            .await;

        // Should be idle after cancel
        match manager.state() {
            ReconnectState::Idle | ReconnectState::Disabled => {}
            _ => panic!("Expected Idle or Disabled after cancel"),
        }
    }
}
