pub mod application;
pub mod commands;
pub mod domain;
pub mod infrastructure;

use std::sync::Arc;

use application::health_service::HealthService;
use commands::health::{health_check, AppState};
use infrastructure::database::SqliteDatabase;
use infrastructure::system::PlatformSystem;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .map_err(|_| domain::error::DomainError::AppDataDirectory)?;
            std::fs::create_dir_all(&app_data_dir)
                .map_err(|_| domain::error::DomainError::AppDataDirectory)?;

            let database = Arc::new(SqliteDatabase::open(&app_data_dir.join("agentforge.db"))?);
            let system = Arc::new(PlatformSystem::current());
            app.manage(AppState {
                health: HealthService::new(database, system),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![health_check])
        .run(tauri::generate_context!())
        .expect("failed to run AgentForge");
}
