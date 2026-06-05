use tauri::State;

use crate::auth::store::AuthStore;
use crate::auth::types::CredentialStatus;

#[tauri::command]
pub fn auth_get_credential_status(store: State<AuthStore>) -> Result<CredentialStatus, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    let user_id = guard.state.as_ref().map(|s| s.user_id.clone());
    let has_password_stored = guard
        .password_encrypted
        .as_ref()
        .is_some_and(|password| !password.trim().is_empty());
    let keyring_error = None;

    Ok(CredentialStatus {
        user_id,
        has_password_stored,
        keyring_error,
    })
}
