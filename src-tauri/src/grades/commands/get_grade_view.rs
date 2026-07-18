use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::grades::parser::parse_semester_grade_view;
use crate::grades::types::SemesterGradeViewResponse;

#[tauri::command]
pub async fn grades_get_student_grade_view(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<SemesterGradeViewResponse, String> {
    let target_semester_id = semester_sub_id.unwrap_or_default();

    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/examinations/examGradeView/doStudentGradeView"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("semesterSubId", target_semester_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("x", &Utc::now().to_rfc2822()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch student grade view: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read student grade view html").await
    })?;

    let data = parse_semester_grade_view(&target_semester_id, &html);

    Ok(SemesterGradeViewResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
