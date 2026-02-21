use std::path::PathBuf;
use tracing::{info, Level};
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Initialize structured logging with file rotation and JSON output.
pub fn init_logging(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let log_dir = app
        .path_resolver()
        .app_log_dir()
        .unwrap_or_else(|| PathBuf::from("./logs"));

    std::fs::create_dir_all(&log_dir)?;

    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_dir, "vpnht.log");

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,vpnht=debug"));

    tracing_subscriber::registry()
        .with(env_filter)
        .with(
            fmt::layer()
                .json()
                .with_writer(file_appender)
                .with_target(true)
                .with_thread_ids(true)
                .with_file(true)
                .with_line_number(true),
        )
        .with(
            fmt::layer()
                .pretty()
                .with_writer(std::io::stderr)
                .with_target(false),
        )
        .init();

    info!(version = env!("CARGO_PKG_VERSION"), "VPN.ht Desktop started");
    Ok(())
}
