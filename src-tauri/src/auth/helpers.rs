use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use reqwest::StatusCode;
use tauri::State;

use crate::attendance::parser::extract_semesters_from_html;
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::types::AuthTokens;

fn has_complete_tokens(tokens: &AuthTokens) -> bool {
    !tokens.authorized_id.trim().is_empty()
        && !tokens.csrf.trim().is_empty()
        && !tokens.cookies.trim().is_empty()
}

pub fn auth_tokens_from_store(store: &State<'_, AuthStore>) -> Result<AuthTokens, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "Failed to lock auth store".to_string())?;

    guard
        .tokens
        .clone()
        .ok_or_else(|| "No auth tokens found".to_string())
}

pub fn selected_semester_id_from_store(
    store: &State<'_, AuthStore>,
) -> Result<Option<String>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "Failed to lock auth store".to_string())?;

    Ok(guard.semester.as_ref().map(|semester| semester.id.clone()))
}

pub async fn get_default_semester_id(tokens: &AuthTokens) -> Result<String, String> {
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
    // More specific checks to avoid false positives on pages with help text
    (lowered.contains("session expired") && lowered.contains("vtop login"))
        || (lowered.contains("vtop login")
            && !lowered.contains("authorizedid")
            && lowered.contains("captcha"))
}

const AUTH_RETRYABLE_STATUS_PREFIX: &str = "auth-retryable-status:";

pub fn is_auth_retryable_status(status: StatusCode) -> bool {
    matches!(
        status,
        StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN | StatusCode::NOT_FOUND
    )
}

pub fn is_auth_retryable_error(err: &str) -> bool {
    err.starts_with(AUTH_RETRYABLE_STATUS_PREFIX)
}

pub async fn response_text_with_auth_retry(
    response: reqwest::Response,
    read_error_context: &str,
) -> Result<String, String> {
    let status = response.status();
    if is_auth_retryable_status(status) {
        return Err(format!("{AUTH_RETRYABLE_STATUS_PREFIX}{}", status.as_u16()));
    }

    response
        .text()
        .await
        .map_err(|e| format!("{read_error_context}: {e}"))
}

#[macro_export]
macro_rules! with_auto_relogin {
    ($app:expr, $store:expr, $tokens:ident, $block:block) => {{
        let mut retry_count = 0;
        loop {
            let result = {
                let $tokens = match $crate::auth::helpers::auth_tokens_from_store(&$store) {
                    Ok(t) => t,
                    Err(err) => return Err(err),
                };
                $block
            };

            match result {
                Ok(html) if $crate::auth::helpers::is_session_expired(&html) && retry_count < 1 => {
                    match $crate::auth::helpers::perform_auto_relogin(&$app, &$store).await {
                        Ok(_) => {
                            retry_count += 1;
                            continue;
                        }
                        Err(e) => return Err(format!("Auto-relogin failed: {}", e)),
                    }
                }
                Err(err)
                    if $crate::auth::helpers::is_auth_retryable_error(&err) && retry_count < 1 =>
                {
                    match $crate::auth::helpers::perform_auto_relogin(&$app, &$store).await {
                        Ok(_) => {
                            retry_count += 1;
                            continue;
                        }
                        Err(e) => return Err(format!("Auto-relogin failed: {}", e)),
                    }
                }
                Err(err) if $crate::auth::helpers::is_auth_retryable_error(&err) => {
                    break Err("Authentication failed after auto-relogin retry".to_string())
                }
                res => break res,
            }
        }
    }};
}

pub async fn perform_auto_relogin(
    app: &tauri::AppHandle,
    store: &State<'_, AuthStore>,
) -> Result<AuthTokens, String> {
    use crate::auth::commands::internal_login;
    use crate::auth::crypto;
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

        let password = if let Some(stored_password) = &guard.password_encrypted {
            crypto::decrypt_password(stored_password)
                .map_err(|e| format!("Failed to decrypt stored password for auto-login: {e}"))?
        } else {
            match keyring::get_password_with_retry(&user_id) {
                Ok(password) => password,
                Err(e) if keyring::is_missing_entry_error(&e) => {
                    return Err(
                        "No stored password found for auto-login. Please log in again.".to_string(),
                    )
                }
                Err(e) => {
                    return Err(format!(
                        "Failed to retrieve password for auto-login (persistent store and keyring unavailable): {e}"
                    ))
                }
            }
        };

        (user_id, password)
    };

    // Mirror Electron behavior: retry once if login returns incomplete token set.
    let mut tokens: Option<AuthTokens> = None;
    for attempt in 1..=2 {
        let candidate = internal_login(&user_id, &password).await?;
        if has_complete_tokens(&candidate) {
            tokens = Some(candidate);
            break;
        }

        if attempt == 2 {
            return Err(
                "Auto-login failed after retry: login succeeded but auth tokens were incomplete"
                    .to_string(),
            );
        }
    }
    let tokens = tokens
        .ok_or_else(|| "Auto-login failed: no auth tokens produced after retry".to_string())?;

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
