use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::content::parser::extract_attendance_from_html;
use crate::content::types::ContentResponse;

#[tauri::command]
pub async fn get_content_page(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ContentResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let url = format!("{VTOP_BASE_URL}/vtop/get/dashboard/current/semester/course/details");
        let x_param = Utc::now().to_rfc2822();

        let response = client
            .post(&url)
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("x", &x_param),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to post to VTOP: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read response html").await
    })?;

    let parsed = extract_attendance_from_html(&html)?;

    Ok(ContentResponse {
        success: true,
        courses: Some(parsed.courses),
        semester: Some(parsed.semester),
        error: None,
    })
}
