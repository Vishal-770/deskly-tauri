use tauri::{AppHandle, State};

use crate::auth::store::{save_to_disk, AuthStore};

#[tauri::command]
pub fn auth_clear_tokens(app: AppHandle, store: State<AuthStore>) -> Result<bool, String> {
    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.tokens = None;
    save_to_disk(&app, &guard)?;

    Ok(true)
}
