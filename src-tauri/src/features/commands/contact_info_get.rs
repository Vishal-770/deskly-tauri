use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::parser::parse_contact_details;
use crate::features::types::ContactResponse;

#[tauri::command]
pub async fn contact_info_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ContactResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/hrms/contactDetails"))
            .header(COOKIE, tokens.cookies.clone())
            .header(
                CONTENT_TYPE,
                "application/x-www-form-urlencoded; charset=UTF-8",
            )
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", &format!("@{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch contact details: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read contact details html").await
    })?;

    Ok(ContactResponse {
        success: true,
        data: Some(parse_contact_details(&html)?),
        error: None,
    })
}
