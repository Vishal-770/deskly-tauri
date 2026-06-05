use tauri::{AppHandle, State};

use crate::auth::store::{save_to_disk, AuthStore};
use crate::auth::types::AuthTokens;

#[tauri::command]
pub fn auth_set_tokens(
    app: AppHandle,
    store: State<AuthStore>,
    tokens: AuthTokens,
) -> Result<bool, String> {
    if tokens.authorized_id.trim().is_empty() {
        return Err("authorizedID is required".to_string());
    }

    if tokens.csrf.trim().is_empty() {
        return Err("csrf is required".to_string());
    }

    if tokens.cookies.trim().is_empty() {
        return Err("cookies is required".to_string());
    }

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.tokens = Some(tokens);
    save_to_disk(&app, &guard)?;

    Ok(true)
}
