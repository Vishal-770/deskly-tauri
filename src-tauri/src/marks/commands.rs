use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::helpers::{auth_tokens_from_store, selected_semester_id_from_store, get_default_semester_id};

use super::parser::parse_marks;
use super::types::MarksResponse;

#[tauri::command]
pub async fn marks_get_student_mark_view(
    app: tauri::AppHandle, // Added app handle for auto-relogin
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<MarksResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(MarksResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let selected_semester_id = selected_semester_id_from_store(&store)?;
        let semester_id = if let Some(id) = semester_sub_id.as_ref().filter(|id| !id.trim().is_empty()) {
            id.clone()
        } else if let Some(id) = selected_semester_id {
            id
        } else {
            get_default_semester_id(&tokens).await?
        };

        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/examinations/doStudentMarkView"
            ))
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
            .map_err(|e| format!("Failed to fetch marks data: {e}"))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read marks html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_marks(&html)?;
    };

    Ok(MarksResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
