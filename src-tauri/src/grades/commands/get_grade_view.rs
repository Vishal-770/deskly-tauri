use reqwest::header::{COOKIE, REFERER};
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
        let form = reqwest::multipart::Form::new()
            .text("authorizedID", tokens.authorized_id.clone())
            .text("semesterSubId", target_semester_id.clone())
            .text("_csrf", tokens.csrf.clone());

        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/examinations/examGradeView/doStudentGradeView"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .multipart(form)
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
