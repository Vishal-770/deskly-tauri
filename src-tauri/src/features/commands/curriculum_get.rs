use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::parser::parse_curriculum_categories;
use crate::features::types::CurriculumCategoriesResponse;

#[tauri::command]
pub async fn curriculum_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<CurriculumCategoriesResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/academics/common/Curriculum"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", &format!("@{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch curriculum: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read curriculum html").await
    })?;

    Ok(CurriculumCategoriesResponse {
        success: true,
        data: Some(parse_curriculum_categories(&html)?),
        error: None,
    })
}
