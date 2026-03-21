use tauri::State;
use chrono::Utc;
use reqwest::header::{COOKIE, CONTENT_TYPE, REFERER};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::helpers::auth_tokens_from_store;
use super::types::GradesResponse;
use super::parser::parse_student_history;

#[tauri::command]
pub async fn grades_get_history(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<GradesResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(GradesResponse {
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
            .post(format!("{VTOP_BASE_URL}/vtop/examinations/examGradeView/StudentGradeHistory"))
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read grade history html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_student_history(&html)?;
    };

    Ok(GradesResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
