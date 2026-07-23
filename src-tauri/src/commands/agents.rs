use tauri::State;

use crate::application::agent_service::{AgentMaintenancePlan, AgentUpdate, LocalAgent};
use crate::commands::health::AppState;
use crate::commands::CommandError;

#[tauri::command]
pub async fn get_local_agents(state: State<'_, AppState>) -> Result<Vec<LocalAgent>, CommandError> {
    Ok(state.agents.discover())
}

#[tauri::command]
pub async fn launch_agent(
    state: State<'_, AppState>,
    project_id: String,
    agent_id: String,
) -> Result<(), CommandError> {
    let project_path = state
        .repo
        .get_project_path(&project_id)
        .map_err(CommandError::from)?
        .ok_or_else(|| CommandError {
            code: "project_not_found".into(),
            details: None,
        })?;
    let preferences = state
        .settings
        .get_launch_preferences()
        .map_err(CommandError::from)?;
    state
        .agents
        .launch(&agent_id, &project_path, &preferences)
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn open_desktop_agent(
    state: State<'_, AppState>,
    agent_id: String,
) -> Result<(), CommandError> {
    state
        .agents
        .open_desktop(&agent_id)
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn check_agent_updates(
    state: State<'_, AppState>,
) -> Result<Vec<AgentUpdate>, CommandError> {
    Ok(state.agents.check_updates())
}

#[tauri::command]
pub async fn get_agent_maintenance_plan(
    state: State<'_, AppState>,
    agent_id: String,
    action: String,
) -> Result<AgentMaintenancePlan, CommandError> {
    state
        .agents
        .maintenance_plan(&agent_id, &action)
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn apply_agent_maintenance(
    state: State<'_, AppState>,
    agent_id: String,
    action: String,
) -> Result<(), CommandError> {
    state
        .agents
        .apply_maintenance(&agent_id, &action)
        .map_err(CommandError::from)
}
