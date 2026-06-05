use tauri::{AppHandle, State};

use crate::auth::store::{save_to_disk, AuthStore};
use crate::auth::types::Semester;

#[tauri::command]
pub fn auth_set_semester(
    app: AppHandle,
    store: State<AuthStore>,
    semester: Semester,
) -> Result<bool, String> {
    if semester.id.trim().is_empty() {
        return Err("semester id is required".to_string());
    }

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.semester = Some(semester);
    save_to_disk(&app, &guard)?;

    Ok(true)
}
