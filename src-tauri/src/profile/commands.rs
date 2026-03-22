use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
// Removed unused import
use super::parser::parse_student_profile;
use super::types::ProfileResponse;
use crate::auth::constants::VTOP_BASE_URL;

#[tauri::command]
pub async fn profile_get_student_profile(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ProfileResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/studentsRecord/StudentProfileAllView"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", &format!("@{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch profile: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read profile html").await
    })?;

    Ok(ProfileResponse {
        success: true,
        data: Some(
            parse_student_profile(&html)
                .map_err(|e| format!("Failed to parse student profile: {e}"))?,
        ),
        error: None,
    })
}
