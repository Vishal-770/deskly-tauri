use reqwest::header::{COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::features::parser::parse_exam_schedule;
use crate::features::types::ExamScheduleResponse;

#[tauri::command]
pub async fn exam_schedule_get(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<ExamScheduleResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let semester_id = if let Some(id) = semester_sub_id.as_ref().filter(|id| !id.trim().is_empty()) {
            id.clone()
        } else if let Some(id) = crate::auth::helpers::selected_semester_id_from_store(&store)? {
            id
        } else {
            crate::auth::helpers::get_default_semester_id(&tokens).await?
        };

        let client = build_http_client()?;
        
        let form = reqwest::multipart::Form::new()
            .text("authorizedID", tokens.authorized_id.clone())
            .text("semesterSubId", semester_id)
            .text("_csrf", tokens.csrf.clone());

        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/examinations/doSearchExamScheduleForStudent"))
            .header(COOKIE, tokens.cookies.clone())
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .multipart(form)
            .send()
            .await
            .map_err(|e| format!("Failed to fetch exam schedule: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read exam schedule html").await
    })?;

    match parse_exam_schedule(&html) {
        Ok(entries) => {
            use crate::features::types::ExamScheduleGroup;
            let mut grouped: Vec<ExamScheduleGroup> = Vec::new();
            for entry in entries {
                if let Some(group) = grouped.iter_mut().find(|g| g.exam_type == entry.exam_type) {
                    group.schedules.push(entry);
                } else {
                    grouped.push(ExamScheduleGroup {
                        exam_type: entry.exam_type.clone(),
                        schedules: vec![entry],
                    });
                }
            }
            Ok(ExamScheduleResponse {
                success: true,
                data: Some(grouped),
                error: None,
            })
        }
        Err(e) => Ok(ExamScheduleResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}
