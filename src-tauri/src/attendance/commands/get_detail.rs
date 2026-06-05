use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::attendance::parser::parse_attendance_details;
use crate::attendance::types::AttendanceDetailResponse;

#[tauri::command]
pub async fn attendance_get_detail(
    app: tauri::AppHandle,
    class_id: String,
    slot_name: String,
    store: State<'_, AuthStore>,
) -> Result<AttendanceDetailResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
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

        response_text_with_auth_retry(response, "Failed to read attendance detail response html")
            .await
    })?;

    Ok(AttendanceDetailResponse {
        success: true,
        data: Some(parse_attendance_details(&html)?),
        error: None,
    })
}
