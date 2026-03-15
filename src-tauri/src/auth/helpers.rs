use tauri::State;
use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};

use crate::auth::store::AuthStore;
use crate::auth::types::AuthTokens;
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::attendance::parser::extract_semesters_from_html;

pub fn auth_tokens_from_store(
    store: &State<'_, AuthStore>,
) -> Result<AuthTokens, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "Failed to lock auth store".to_string())?;

    guard
        .tokens
        .clone()
        .ok_or_else(|| "No auth tokens found".to_string())
}

pub fn selected_semester_id_from_store(store: &State<'_, AuthStore>) -> Result<Option<String>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "Failed to lock auth store".to_string())?;

    Ok(guard.semester.as_ref().map(|semester| semester.id.clone()))
}

pub async fn get_default_semester_id(
    tokens: &AuthTokens,
) -> Result<String, String> {
    let client = build_http_client()?;
    let response = client
        .post(format!(
            "{VTOP_BASE_URL}/vtop/academics/common/StudentTimeTableChn"
        ))
        .header(COOKIE, tokens.cookies.clone())
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
        .form(&[
            ("verifyMenu", "true"),
            ("authorizedID", tokens.authorized_id.as_str()),
            ("_csrf", tokens.csrf.as_str()),
            ("nocache", &Utc::now().timestamp_millis().to_string()),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to fetch semester list: {e}"))?;

    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read semester list html: {e}"))?;
    let semesters = extract_semesters_from_html(&html)?;
    semesters
        .first()
        .map(|s| s.id.clone())
        .ok_or_else(|| "No semester info found".to_string())
}

pub fn is_session_expired(html: &str) -> bool {
    let lowered = html.to_lowercase();
    // VTOP usually redirects to login or shows "Session Expired" / "Login again"
    lowered.contains("session expired") 
    || lowered.contains("login again")
    || (lowered.contains("vtop login") && !lowered.contains("authorizedid"))
}

pub async fn perform_auto_relogin(
    app: &tauri::AppHandle,
    store: &State<'_, AuthStore>,
) -> Result<AuthTokens, String> {
    use crate::auth::commands::internal_login;
    use crate::auth::keyring;
    use crate::auth::store::{now_unix_ms, save_to_disk};

    let (user_id, password) = {
        let guard = store
            .inner
            .lock()
            .map_err(|_| "failed to lock auth store".to_string())?;

        let user_id = guard
            .state
            .as_ref()
            .ok_or_else(|| "No active session found for auto-login".to_string())?
            .user_id
            .clone();

        let password = keyring::get_password(&user_id)
            .map_err(|e| format!("Failed to retrieve password for auto-login: {e}"))?;

        (user_id, password)
    };

    let tokens = internal_login(&user_id, &password).await?;

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.tokens = Some(tokens.clone());
    if let Some(state) = guard.state.as_mut() {
        state.last_login = now_unix_ms();
    }
    save_to_disk(app, &guard)?;

    Ok(tokens)
}
