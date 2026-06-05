use tauri::{AppHandle, State};

use crate::auth::store::AuthStore;
use crate::auth::types::AuthTokens;

#[tauri::command]
pub async fn auth_auto_relogin(
    app: AppHandle,
    store: State<'_, AuthStore>,
) -> Result<AuthTokens, String> {
    crate::auth::helpers::perform_auto_relogin(&app, &store).await
}
