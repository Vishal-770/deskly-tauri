use super::parser::parse_feedback_status;
use super::types::FeedbackResponse;
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::helpers::{get_default_semester_id, selected_semester_id_from_store};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

#[tauri::command]
pub async fn feedback_get_status(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<FeedbackResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
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

        response_text_with_auth_retry(response, "Failed to read feedback status response html")
            .await
    })?;

    Ok(FeedbackResponse {
        success: true,
        data: Some(parse_feedback_status(&html)?),
        error: None,
    })
}
