use tauri::State;

use crate::auth::store::AuthStore;
use crate::auth::types::Semester;

#[tauri::command]
pub fn auth_get_semester(store: State<AuthStore>) -> Result<Option<Semester>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    Ok(guard.semester.clone())
}
