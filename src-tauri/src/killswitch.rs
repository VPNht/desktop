use std::process::Command;
use std::sync::Arc;
use tauri::Manager;
use tracing::{info, warn};

pub struct KillSwitch {
    enabled: bool,
    firewall_rules: Vec<String>,
}

impl KillSwitch {
    pub fn new() -> Self {
        Self {
            enabled: false,
            firewall_rules: Vec::new(),
        }
    }

    pub fn enable(&mut self) -> Result<(), String> {
        if self.enabled {
            return Ok(());
        }
        
        #[cfg(target_os = "linux")]
        self.setup_iptables()?;
        
        #[cfg(target_os = "windows")]
        self.setup_wfp()?;
        
        #[cfg(target_os = "macos")]
        self.setup_pf()?;
        
        self.enabled = true;
        info!("Kill Switch enabled");
        Ok(())
    }

    pub fn disable(&mut self) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }
        
        #[cfg(target_os = "linux")]
        self.teardown_iptables()?;
        
        #[cfg(target_os = "windows")]
        self.teardown_wfp()?;
        
        #[cfg(target_os = "macos")]
        self.teardown_pf()?;
        
        self.enabled = false;
        info!("Kill Switch disabled");
        Ok(())
    }

    pub fn on_vpn_disconnect(&self) -> Result<(), String> {
        if !self.enabled {
            return Ok(());
        }
        
        info!("VPN disconnected - activating Kill Switch");
        #[cfg(target_os = "linux")]
        self.block_all_traffic_linux()?;
        
        Ok(())
    }

    // Linux implementation
    #[cfg(target_os = "linux")]
    fn setup_iptables(&mut self) -> Result<(), String> {
        // Save current rules
        let output = Command::new("iptables")
            .args(["-L", "-n", "-v"])
            .output()
            .map_err(|e| format!("Failed to list iptables rules: {}", e))?;
        
        self.firewall_rules = String::from_utf8_lossy(&output.stdout)
            .lines()
            .map(|s| s.to_string())
            .collect();
        
        info!("Saved {} iptables rules", self.firewall_rules.len());
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn teardown_iptables(&mut self) -> Result<(), String> {
        // Restore saved rules
        for rule in &self.firewall_rules {
            if rule.contains("vpnht-killswitch") {
                let args: Vec<&str> = rule.split_whitespace().collect();
                Command::new("iptables")
                    .args(&args)
                    .status()
                    .map_err(|e| format!("Failed to restore iptables rule: {}", e))?;
            }
        }
        
        self.firewall_rules.clear();
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn block_all_traffic_linux(&self) -> Result<(), String> {
        // Block all non-VPN traffic
        Command::new("iptables")
            .args(["-A", "OUTPUT", "-m", "mark", "!", "--mark", "0xca6c", "-m", "addrtype", "!", "--dst-type", "LOCAL", "-j", "DROP", "-m", "comment", "--comment", "vpnht-killswitch"])
            .status()
            .map_err(|e| format!("Failed to block traffic: {}", e))?;
        
        Command::new("iptables")
            .args(["-A", "INPUT", "-m", "mark", "!", "--mark", "0xca6c", "-j", "DROP", "-m", "comment", "--comment", "vpnht-killswitch"])
            .status()
            .map_err(|e| format!("Failed to block input traffic: {}", e))?;
        
        info!("All non-VPN traffic blocked");
        Ok(())
    }
}