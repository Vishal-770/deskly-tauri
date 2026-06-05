use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::{response_text_with_auth_retry, selected_semester_id_from_store};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::attendance::parser::{extract_semesters_from_html, parse_attendance};
use crate::attendance::types::AttendanceResponse;

#[tauri::command]
pub async fn attendance_get_current(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<AttendanceResponse, String> {
    let mut semester_id_final;
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let selected_semester_id = selected_semester_id_from_store(&store)?;
        let semester_id = if let Some(id) = selected_semester_id.filter(|id| !id.trim().is_empty())
        {
            id
        } else {
            let semesters_html = super::get_semesters::fetch_semesters_html(&tokens).await?;
            let semesters = extract_semesters_from_html(&semesters_html)?;
            match semesters.first() {
                Some(s) => s.id.clone(),
                None => return Err("No semester info found".to_string()),
            }
        };
        semester_id_final = Some(semester_id.clone());

        let client = build_http_client()?;
        let url = format!("{VTOP_BASE_URL}/vtop/processViewStudentAttendance");
        let x_param = Utc::now().to_rfc2822();

        let response = client
            .post(url)
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("semesterSubId", semester_id.as_str()),
                ("x", &x_param),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch attendance: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read attendance response html").await
    })?;

    Ok(AttendanceResponse {
        success: true,
        data: Some(parse_attendance(&html)?),
        semester_id: semester_id_final,
        error: None,
    })
}
