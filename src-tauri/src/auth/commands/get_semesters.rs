use tauri::State;

use crate::auth::store::AuthStore;
use crate::auth::types::Semester;

#[tauri::command]
pub async fn auth_get_semesters(store: State<'_, AuthStore>) -> Result<Vec<Semester>, String> {
    let tokens = {
        let guard = store
            .inner
            .lock()
            .map_err(|_| "failed to lock auth store".to_string())?;

        guard
            .tokens
            .clone()
            .ok_or_else(|| "No auth tokens found".to_string())?
    };

    super::login::fetch_semesters(&tokens).await
}
