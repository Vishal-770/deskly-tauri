use super::formatter::generate_weekly_schedule;
use super::parser::parse_timetable_courses;
use super::types::{TimetableResponse, WeeklyScheduleResponse};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::helpers::{get_default_semester_id, selected_semester_id_from_store};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

#[tauri::command]
pub async fn timetable_get_courses(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<TimetableResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let semester_id = if let Some(id) = semester_sub_id.as_ref() {
            id.clone()
        } else if let Some(id) = selected_semester_id_from_store(&store)? {
            id
        } else {
            get_default_semester_id(&tokens).await?
        };

        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/processViewTimeTable"))
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
            .map_err(|e| format!("Failed to fetch timetable courses: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read timetable html").await
    })?;

    Ok(TimetableResponse {
        success: true,
        data: Some(parse_timetable_courses(&html)?),
        error: None,
    })
}

#[tauri::command]
pub async fn timetable_get_weekly(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<WeeklyScheduleResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let semester_id = if let Some(id) = semester_sub_id.as_ref() {
            id.clone()
        } else {
            get_default_semester_id(&tokens).await?
        };

        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/processViewTimeTable"))
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
            .map_err(|e| format!("Failed to fetch timetable: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read timetable html").await
    })?;

    let courses = parse_timetable_courses(&html)?;
    Ok(WeeklyScheduleResponse {
        success: true,
        data: Some(generate_weekly_schedule(&courses)),
        error: None,
    })
}
