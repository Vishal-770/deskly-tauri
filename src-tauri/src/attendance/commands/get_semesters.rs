use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::attendance::parser::extract_semesters_from_html;
use crate::attendance::types::SemestersResponse;

pub(crate) async fn fetch_semesters_html(tokens: &crate::auth::types::AuthTokens) -> Result<String, String> {
    let client = build_http_client()?;
    let url = format!("{VTOP_BASE_URL}/vtop/academics/common/StudentTimeTableChn");

    let response = client
        .post(url)
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
        .map_err(|e| format!("Failed to fetch semesters: {e}"))?;

    response_text_with_auth_retry(response, "Failed to read semester response html").await
}

#[tauri::command]
pub async fn attendance_get_semesters(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<SemestersResponse, String> {
    let html =
        crate::with_auto_relogin!(app, store, tokens, { fetch_semesters_html(&tokens).await })?;

    let semesters = extract_semesters_from_html(&html)?;

    Ok(SemestersResponse {
        success: true,
        semesters: Some(semesters),
        error: None,
    })
}
