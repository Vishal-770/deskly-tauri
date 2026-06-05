use tauri::{AppHandle, State};

use crate::auth::keyring;
use crate::auth::store::{save_to_disk, AuthStore};

#[tauri::command]
pub fn auth_logout(app: AppHandle, store: State<AuthStore>) -> Result<bool, String> {
    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    if let Some(state) = &guard.state {
        let _ = keyring::delete_password(&state.user_id);
    }

    guard.state = None;
    guard.tokens = None;
    guard.semester = None;
    guard.password_encrypted = None;
    save_to_disk(&app, &guard)?;

    Ok(true)
}
