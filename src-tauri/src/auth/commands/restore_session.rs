use tauri::{AppHandle, State};

use crate::auth::store::{load_from_disk, save_to_disk, AuthStore};
use crate::auth::types::AuthState;

#[tauri::command]
pub async fn auth_restore_session(
    app: AppHandle,
    store: State<'_, AuthStore>,
) -> Result<Option<AuthState>, String> {
    let persisted = load_from_disk(&app);

    let (state, tokens_missing) = {
        let mut guard = store
            .inner
            .lock()
            .map_err(|_| "failed to lock auth store".to_string())?;

        *guard = persisted;
        (guard.state.clone(), guard.tokens.is_none())
    };

    if state
        .as_ref()
        .is_some_and(|s| s.logged_in && tokens_missing)
    {
        // Proactively try to re-login if we have a state but no tokens.
        // If relogin fails, clear stale persisted auth to avoid false logged-in UI state.
        if crate::auth::helpers::perform_auto_relogin(&app, &store)
            .await
            .is_err()
        {
            let mut guard = store
                .inner
                .lock()
                .map_err(|_| "failed to lock auth store".to_string())?;
            guard.state = None;
            guard.tokens = None;
            guard.semester = None;
            guard.password_encrypted = None;
            save_to_disk(&app, &guard)?;
            return Ok(None);
        }
    }

    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;
    Ok(guard.state.clone())
}
