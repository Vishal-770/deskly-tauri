use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::helpers::{get_default_semester_id, selected_semester_id_from_store};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use super::parser::parse_marks;
use super::types::MarksResponse;

#[tauri::command]
pub async fn marks_get_student_mark_view(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<MarksResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let selected_semester_id = selected_semester_id_from_store(&store)?;
        let semester_id =
            if let Some(id) = semester_sub_id.as_ref().filter(|id| !id.trim().is_empty()) {
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

        response_text_with_auth_retry(response, "Failed to read marks html").await
    })?;

    Ok(MarksResponse {
        success: true,
        data: Some(parse_marks(&html)?),
        error: None,
    })
}
