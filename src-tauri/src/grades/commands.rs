use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;
// Removed unused import
use super::parser::parse_student_history;
use super::types::GradesResponse;

#[tauri::command]
pub async fn grades_get_history(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<GradesResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/examinations/examGradeView/StudentGradeHistory"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", &format!("{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch grade history: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read grade history html").await
    })?;

    Ok(GradesResponse {
        success: true,
        data: Some(parse_student_history(&html)?),
        error: None,
    })
}
