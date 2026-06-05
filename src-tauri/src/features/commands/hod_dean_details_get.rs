use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::features::parser::parse_hod_dean_details;
use crate::features::types::HodDeanResponse;

#[tauri::command]
pub async fn hod_dean_details_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<HodDeanResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/hrms/viewHodDeanDetails"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded; charset=UTF-8")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", ""),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch HOD/Dean details: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read HOD/Dean details html").await
    })?;

    match parse_hod_dean_details(&html) {
        Ok(data) => Ok(HodDeanResponse {
            success: true,
            data: Some(data),
            error: None,
        }),
        Err(e) => Ok(HodDeanResponse {
            success: false,
            data: None,
            error: Some(e),
        }),
    }
}
