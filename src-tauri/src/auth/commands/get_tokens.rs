use tauri::State;

use crate::auth::store::AuthStore;
use crate::auth::types::AuthTokens;

#[tauri::command]
pub fn auth_get_tokens(store: State<AuthStore>) -> Result<Option<AuthTokens>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    Ok(guard.tokens.clone())
}
