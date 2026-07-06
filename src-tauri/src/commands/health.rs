use std::sync::Arc;
use tauri::State;

use crate::application::health_service::HealthService;
use crate::application::skill_service::SkillService;
use crate::domain::ports::SkillRepository;
use crate::commands::CommandError;
use crate::domain::health::HealthReport;

pub struct AppState {
    pub health: HealthService,
    pub skills: SkillService,
    pub repo: Arc<dyn SkillRepository>,
}

#[tauri::command]
pub fn health_check(state: State<'_, AppState>) -> Result<HealthReport, CommandError> {
    state.health.check().map_err(CommandError::from)
}
