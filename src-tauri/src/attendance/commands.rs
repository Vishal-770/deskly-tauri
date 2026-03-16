use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::helpers::{auth_tokens_from_store, selected_semester_id_from_store};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use super::parser::{extract_semesters_from_html, parse_attendance, parse_attendance_details};
use super::types::{AttendanceDetailResponse, AttendanceResponse, SemestersResponse};

async fn fetch_semesters_html(tokens: &crate::auth::types::AuthTokens) -> Result<String, String> {
    let client = build_http_client()?;
    let url = format!("{VTOP_BASE_URL}/vtop/academics/common/StudentTimeTableChn");

    let response = client
        .post(url)
        .header(COOKIE, tokens.cookies.clone())
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
        .form(&[
            ("verifyMenu", "true"),
            ("authorizedID", tokens.authorized_id.as_str()),
            ("_csrf", tokens.csrf.as_str()),
            ("nocache", &Utc::now().timestamp_millis().to_string()),
        ])
        .send()
        .await
        .map_err(|e| format!("Failed to fetch semesters: {e}"))?;

    response
        .text()
        .await
        .map_err(|e| format!("Failed to read semester response html: {e}"))
}

#[tauri::command]
pub async fn attendance_get_semesters(
    store: State<'_, AuthStore>,
) -> Result<SemestersResponse, String> {
    let tokens = match auth_tokens_from_store(&store) {
        Ok(tokens) => tokens,
        Err(err) => {
            return Ok(SemestersResponse {
                success: false,
                semesters: None,
                error: Some(err),
            })
        }
    };

    let html = fetch_semesters_html(&tokens).await?;
    let semesters = extract_semesters_from_html(&html)?;

    Ok(SemestersResponse {
        success: true,
        semesters: Some(semesters),
        error: None,
    })
}

#[tauri::command]
pub async fn attendance_get_current(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<AttendanceResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(AttendanceResponse {
                success: false,
                data: None,
                semester_id: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let (data, semester_id) = loop {
        let selected_semester_id = selected_semester_id_from_store(&store)?;
        let semester_id = if let Some(id) = selected_semester_id.filter(|id| !id.trim().is_empty()) {
            id
        } else {
            let semesters_html = fetch_semesters_html(&tokens).await?;
            let semesters = extract_semesters_from_html(&semesters_html)?;
            match semesters.first() {
                Some(s) => s.id.clone(),
                None => {
                    return Ok(AttendanceResponse {
                        success: false,
                        data: None,
                        semester_id: None,
                        error: Some("No semester info found".to_string()),
                    })
                }
            }
        };

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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read attendance response html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break (parse_attendance(&html)?, semester_id);
    };

    Ok(AttendanceResponse {
        success: true,
        data: Some(data),
        semester_id: Some(semester_id),
        error: None,
    })
}

#[tauri::command]
pub async fn attendance_get_detail(
    app: tauri::AppHandle,
    class_id: String,
    slot_name: String,
    store: State<'_, AuthStore>,
) -> Result<AttendanceDetailResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(AttendanceDetailResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let client = build_http_client()?;
        let url = format!("{VTOP_BASE_URL}/vtop/processViewAttendanceDetail");
        let x_param = Utc::now().to_rfc2822();

        let response = client
            .post(url)
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("classId", class_id.as_str()),
                ("slotName", slot_name.as_str()),
                ("x", &x_param),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch attendance details: {e}"))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read attendance detail response html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_attendance_details(&html)?;
    };

    Ok(AttendanceDetailResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
