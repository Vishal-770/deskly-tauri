use tauri::State;
use chrono::Utc;
use reqwest::header::{COOKIE, CONTENT_TYPE, REFERER};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::helpers::{auth_tokens_from_store, selected_semester_id_from_store, get_default_semester_id};
use super::types::FeedbackResponse;
use super::parser::parse_feedback_status;

#[tauri::command]
pub async fn feedback_get_status(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<FeedbackResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(FeedbackResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let semester_id = match selected_semester_id_from_store(&store)? {
            Some(id) => id,
            None => get_default_semester_id(&tokens).await?,
        };

        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/processViewFeedBackStatus"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("semesterSubId", semester_id.as_str()),
                ("x", &Utc::now().to_rfc2822()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch feedback status: {e}"))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read feedback status response html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_feedback_status(&html)?;
    };

    Ok(FeedbackResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
