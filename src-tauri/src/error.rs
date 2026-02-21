use std::fmt;

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

impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}

impl From<&str> for AppError {
    fn from(msg: &str) -> Self {
        AppError::Connection(msg.to_string())
    }
}

impl From<String> for AppError {
    fn from(msg: String) -> Self {
        AppError::Connection(msg)
    }
}

pub type Result<T> = std::result::Result<T, String>;
