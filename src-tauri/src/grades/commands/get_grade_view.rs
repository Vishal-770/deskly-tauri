use reqwest::header::{COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::{
    get_default_semester_id, response_text_with_auth_retry, selected_semester_id_from_store,
};
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
    let mut fetched_semester_id = String::new();

    if let Some(id) = semester_sub_id.as_ref().filter(|id| !id.trim().is_empty()) {
        fetched_semester_id = id.clone();
    } else if let Ok(Some(id)) = selected_semester_id_from_store(&store) {
        fetched_semester_id = id;
    }

    let html = crate::with_auto_relogin!(app, store, tokens, {
        let semester_id = if !fetched_semester_id.is_empty() {
            fetched_semester_id.clone()
        } else {
            let def_id = get_default_semester_id(&tokens).await?;
            fetched_semester_id = def_id.clone();
            def_id
        };

        let client = build_http_client()?;
        let form = reqwest::multipart::Form::new()
            .text("authorizedID", tokens.authorized_id.clone())
            .text("semesterSubId", semester_id)
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

    let data = parse_semester_grade_view(&fetched_semester_id, &html);

    Ok(SemesterGradeViewResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
