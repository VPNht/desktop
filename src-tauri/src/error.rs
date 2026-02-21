use std::fmt;
use serde::Serialize;

#[derive(Debug)]
pub enum AppError {
    Connection(String),
    Config(String),
    Storage(String),
    Auth(String),
    Network(String),
    Platform(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Connection(msg) => write!(f, "Connection error: {}", msg),
            AppError::Config(msg) => write!(f, "Config error: {}", msg),
            AppError::Storage(msg) => write!(f, "Storage error: {}", msg),
            AppError::Auth(msg) => write!(f, "Auth error: {}", msg),
            AppError::Network(msg) => write!(f, "Network error: {}", msg),
            AppError::Platform(msg) => write!(f, "Platform error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<AppError> for tauri::InvokeError {
    fn from(err: AppError) -> Self {
        tauri::InvokeError::from(err.to_string())
    }
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<reqwest::Error> for AppError {
    fn from(err: reqwest::Error) -> Self {
        AppError::Network(err.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Config(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Platform(err.to_string())
    }
}

impl From<keyring::Error> for AppError {
    fn from(err: keyring::Error) -> Self {
        AppError::Storage(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;
