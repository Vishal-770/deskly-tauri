use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::parser::parse_curriculum_courses;
use crate::features::types::CurriculumCoursesResponse;

#[tauri::command]
pub async fn curriculum_get_category_view(
    app: tauri::AppHandle,
    category_id: String,
    store: State<'_, AuthStore>,
) -> Result<CurriculumCoursesResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/academics/common/curriculumCategoryView"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("categoryId", category_id.as_str()),
                ("nocache", &format!("@{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch curriculum category view: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read curriculum category view html")
            .await
    })?;

    Ok(CurriculumCoursesResponse {
        success: true,
        data: Some(parse_curriculum_courses(&html)?),
        error: None,
    })
}
