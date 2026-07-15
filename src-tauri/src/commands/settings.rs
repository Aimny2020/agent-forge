use tauri::State;

use crate::commands::health::AppState;
use crate::commands::CommandError;
use crate::domain::settings::LaunchPreferences;

#[tauri::command]
pub async fn get_launch_preferences(
    state: State<'_, AppState>,
) -> Result<LaunchPreferences, CommandError> {
    state
        .settings
        .get_launch_preferences()
        .map_err(CommandError::from)
}

#[tauri::command]
pub async fn save_launch_preferences(
    state: State<'_, AppState>,
    preferences: LaunchPreferences,
) -> Result<LaunchPreferences, CommandError> {
    state
        .settings
        .save_launch_preferences(&preferences)
        .map_err(CommandError::from)?;
    Ok(preferences)
}
