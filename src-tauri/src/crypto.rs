use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use rand::RngCore;
use ring::digest::{digest, SHA256};

// CryptoError not currently used but reserved for future error handling
#[allow(dead_code)]
#[derive(Debug)]
pub struct CryptoError(String);

impl std::fmt::Display for CryptoError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for CryptoError {}

/// Generate a random encryption key and return it as base64
pub fn generate_key() -> String {
    let mut key = [0u8; 32];
    OsRng.fill_bytes(&mut key);
    STANDARD.encode(key)
}

/// Derive a 256-bit key from a passphrase using SHA-256
fn derive_key(passphrase: &str) -> [u8; 32] {
    let hash = digest(&SHA256, passphrase.as_bytes());
    let mut key = [0u8; 32];
    key.copy_from_slice(hash.as_ref());
    key
}

/// Encrypt data using AES-256-GCM
pub fn encrypt_data(plaintext: &str, key: &str) -> Result<String, String> {
    // Derive key from passphrase
    let derived_key = derive_key(key);
    
    // Create cipher instance
    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Generate random nonce (12 bytes for GCM)
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt the plaintext
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Encryption failed: {}", e))?;

    // Combine nonce + ciphertext and encode as base64
    let mut result = Vec::new();
    result.extend_from_slice(&nonce_bytes);
    result.extend_from_slice(&ciphertext);

    Ok(STANDARD.encode(&result))
}

/// Decrypt data using AES-256-GCM
pub fn decrypt_data(ciphertext: &str, key: &str) -> Result<String, String> {
    // Decode base64
    let encrypted_data = STANDARD
        .decode(ciphertext)
        .map_err(|e| format!("Invalid base64: {}", e))?;

    // Check minimum length (12 bytes nonce + at least 16 bytes tag)
    if encrypted_data.len() < 28 {
        return Err("Invalid encrypted data".to_string());
    }

    // Extract nonce and ciphertext
    let nonce = Nonce::from_slice(&encrypted_data[0..12]);
    let encrypted_text = &encrypted_data[12..];

    // Derive key from passphrase
    let derived_key = derive_key(key);

    // Create cipher instance
    let cipher = Aes256Gcm::new_from_slice(&derived_key)
        .map_err(|e| format!("Failed to create cipher: {}", e))?;

    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, encrypted_text)
        .map_err(|e| format!("Decryption failed: {}", e))?;

    String::from_utf8(plaintext)
        .map_err(|e| format!("Invalid UTF-8: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_generation() {
        let key1 = generate_key();
        let key2 = generate_key();
        
        assert_eq!(key1.len(), 44); // Base64 encoding of 32 bytes
        assert_eq!(key2.len(), 44);
        assert_ne!(key1, key2); // Keys should be random
    }

    #[test]
    fn test_encrypt_decrypt() {
        let plaintext = "Hello, WireGuard Config!";
        let key = "my_secret_password_123";

        let encrypted = encrypt_data(plaintext, key).unwrap();
        let decrypted = decrypt_data(&encrypted, key).unwrap();

        assert_eq!(plaintext, decrypted);
    }

    #[test]
    fn test_decrypt_with_wrong_key() {
        let plaintext = "Secret data";
        let key = "correct_password";
        let wrong_key = "wrong_password";

        let encrypted = encrypt_data(plaintext, key).unwrap();
        let result = decrypt_data(&encrypted, wrong_key);

        assert!(result.is_err());
    }

    #[test]
    fn test_wireguard_config_encryption() {
        let config = r#"[Interface]
PrivateKey = ABC123XYZ...
Address = 10.0.0.2/32
DNS = 1.1.1.1, 8.8.8.8

[Peer]
PublicKey = ServerPubKey...
AllowedIPs = 0.0.0.0/0, ::/0
Endpoint = vpn.example.com:51820
PersistentKeepalive = 25"#;

        let key = "user_password_123";

        let encrypted = encrypt_data(config, key).unwrap();
        let decrypted = decrypt_data(&encrypted, key).unwrap();

        assert_eq!(config, decrypted);
    }
}
