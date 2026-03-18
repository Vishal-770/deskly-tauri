use tauri::State;
use reqwest::header::{COOKIE, CONTENT_TYPE, REFERER};
use chrono::Utc;

use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::helpers::{auth_tokens_from_store};
use crate::auth::constants::VTOP_BASE_URL;
use super::types::ProfileResponse;
use super::parser::parse_student_profile;

#[tauri::command]
pub async fn profile_get_student_profile(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ProfileResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(ProfileResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/studentsRecord/StudentProfileAllView"))
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read profile html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_student_profile(&html).map_err(|e| format!("Failed to parse student profile: {e}"))?;
    };

    Ok(ProfileResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
