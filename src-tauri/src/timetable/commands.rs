use tauri::State;
use chrono::Utc;
use reqwest::header::{COOKIE, CONTENT_TYPE, REFERER};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::auth::helpers::{auth_tokens_from_store, get_default_semester_id, selected_semester_id_from_store};
use super::types::{TimetableResponse, WeeklyScheduleResponse};
use super::parser::parse_timetable_courses;
use super::formatter::generate_weekly_schedule;

#[tauri::command]
pub async fn timetable_get_courses(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<TimetableResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(TimetableResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read timetable html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_timetable_courses(&html)?;
    };

    Ok(TimetableResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn timetable_get_weekly(
    app: tauri::AppHandle,
    semester_sub_id: Option<String>,
    store: State<'_, AuthStore>,
) -> Result<WeeklyScheduleResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(WeeklyScheduleResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read timetable html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        let courses = parse_timetable_courses(&html)?;
        break generate_weekly_schedule(&courses);
    };

    Ok(WeeklyScheduleResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
