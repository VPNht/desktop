use std::process::Command;
use std::sync::Arc;
use tauri::Manager;
use tracing::{info, warn, error};

// Interface name sanitization
fn sanitize_interface_name(name: &str) -> Result<String, String> {
    if name.len() > 15 {
        return Err("Interface name too long".into());
    }
    if !name.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
        return Err("Invalid interface name".into());
    }
    Ok(name.to_string())
}

// Platform-specific privileged command execution
#[cfg(target_os = "linux")]
fn run_privileged_command(cmd: &str, args: &[&str]) -> Result<std::process::Output, String> {
    // First try without elevation (in case already root)
    let output = Command::new(cmd).args(args).output();
    
    match output {
        Ok(o) if o.status.success() => Ok(o),
        _ => {
            // Try with pkexec for graphical privilege escalation
            Command::new("pkexec")
                .arg(cmd)
                .args(args)
                .output()
                .map_err(|e| format!("Failed to run privileged command: {}", e))
        }
    }
}

#[cfg(target_os = "macos")]
fn run_privileged_command(cmd: &str, args: &[&str]) -> Result<std::process::Output, String> {
    // macOS uses osascript for privilege escalation
    let mut full_args = vec!["-e", &format!("do shell script \"{} {}\" with administrator privileges", cmd, args.join(" "))];
    
    Command::new("osascript")
        .args(&full_args)
        .output()
        .map_err(|e| format!("Failed to run privileged command: {}", e))
}

#[cfg(target_os = "windows")]
fn run_privileged_command(cmd: &str, args: &[&str]) -> Result<std::process::Output, String> {
    // Windows uses runas
    let mut full_args = vec!["/user:Administrator", &format!("{} {}", cmd, args.join(" "))];
    
    Command::new("runas")
        .args(&full_args)
        .output()
        .map_err(|e| format!("Failed to run privileged command: {}", e))
}

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
        let output = run_privileged_command("iptables", &["-L", "-n", "-v"])?;
        
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
                run_privileged_command("iptables", &args)?;
            }
        }
        
        self.firewall_rules.clear();
        Ok(())
    }

    #[cfg(target_os = "linux")]
    fn block_all_traffic_linux(&self) -> Result<(), String> {
        // Block all non-VPN traffic using privileged command
        run_privileged_command(
            "iptables", 
            &["-A", "OUTPUT", "-m", "mark", "!", "--mark", "0xca6c", "-m", "addrtype", "!", "--dst-type", "LOCAL", "-j", "DROP", "-m", "comment", "--comment", "vpnht-killswitch"]
        )?;
        
        run_privileged_command(
            "iptables", 
            &["-A", "INPUT", "-m", "mark", "!", "--mark", "0xca6c", "-j", "DROP", "-m", "comment", "--comment", "vpnht-killswitch"]
        )?;
        
        info!("All non-VPN traffic blocked");
        Ok(())
    }
}