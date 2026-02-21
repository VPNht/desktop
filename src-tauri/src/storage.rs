use serde::{de::DeserializeOwned, Serialize};
use tauri::{AppHandle, Manager};
use crate::error::Result;
use keyring::Entry;

pub struct SecureStorage {
    service_name: String,
}

impl SecureStorage {
    pub fn new(service_name: String) -> Self {
        Self { service_name }
    }

    pub async fn store<T: Serialize>(&self, key: &str, value: &T) -> Result<()> {
        let json = serde_json::to_string(value)
            .map_err(|e| format!("Serialization error: {}", e))?;
        
        let entry = Entry::new(&self.service_name, key)
            .map_err(|e| format!("Keyring error: {}", e))?;
        
        entry.set_password(&json)
            .map_err(|e| format!("Storage error: {}", e))?;
        
        Ok(())
    }

    pub async fn retrieve<T: DeserializeOwned>(&self, key: &str) -> Result<Option<T>> {
        let entry = Entry::new(&self.service_name, key)
            .map_err(|e| format!("Keyring error: {}", e))?;
        
        match entry.get_password() {
            Ok(json) => {
                let value = serde_json::from_str(&json)
                    .map_err(|e| format!("Deserialization error: {}", e))?;
                Ok(Some(value))
            }
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("Retrieval error: {}", e)),
        }
    }

    pub async fn store_raw(&self, key: &str, value: &str) -> Result<()> {
        let entry = Entry::new(&self.service_name, key)
            .map_err(|e| format!("Keyring error: {}", e))?;
        
        entry.set_password(value)
            .map_err(|e| format!("Storage error: {}", e))?;
        
        Ok(())
    }

    pub async fn retrieve_raw(&self, key: &str) -> Result<Option<String>> {
        let entry = Entry::new(&self.service_name, key)
            .map_err(|e| format!("Keyring error: {}", e))?;
        
        match entry.get_password() {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(format!("Retrieval error: {}", e)),
        }
    }

    pub async fn delete(&self, key: &str) -> Result<()> {
        let entry = Entry::new(&self.service_name, key)
            .map_err(|e| format!("Keyring error: {}", e))?;
        
        entry.delete_password()
            .map_err(|e| format!("Deletion error: {}", e))?;
        
        Ok(())
    }
}

pub fn init_secure_storage(app: &AppHandle) -> Result<()> {
    // Initialization complete - SecureStorage is now managed
    app.manage(SecureStorage::new("com.vpnht.desktop".to_string()));
    Ok(())
}
