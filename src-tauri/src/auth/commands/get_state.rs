use tauri::State;

use crate::auth::store::AuthStore;
use crate::auth::types::AuthState;

#[tauri::command]
pub fn auth_get_state(store: State<AuthStore>) -> Result<Option<AuthState>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    Ok(guard.state.clone())
}
