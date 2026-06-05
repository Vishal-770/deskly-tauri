use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::parser::parse_receipts;
use crate::features::types::ReceiptResponse;

#[tauri::command]
pub async fn payment_receipts_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ReceiptResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/p2p/getReceiptsApplno"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
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
            .map_err(|e| format!("Failed to fetch receipts: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read receipts html").await
    })?;

    Ok(ReceiptResponse {
        success: true,
        data: Some(parse_receipts(&html)?),
        error: None,
    })
}
