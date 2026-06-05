use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::{
    get_default_semester_id, response_text_with_auth_retry, selected_semester_id_from_store,
};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::parser::parse_calendar_view;
use crate::features::types::CalendarViewResponse;

#[tauri::command]
pub async fn academic_calendar_get_view(
    app: tauri::AppHandle,
    cal_date: String,
    store: State<'_, AuthStore>,
) -> Result<CalendarViewResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let sem_id = match selected_semester_id_from_store(&store)? {
            Some(id) => id,
            None => get_default_semester_id(&tokens).await?,
        };

        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/processViewCalendar"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .form(&[
                ("_csrf", tokens.csrf.as_str()),
                ("calDate", cal_date.as_str()),
                ("semSubId", sem_id.as_str()),
                ("classGroupId", "COMB"),
                ("authorizedID", tokens.authorized_id.as_str()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch academic calendar month view: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read academic calendar view html").await
    })?;

    Ok(CalendarViewResponse {
        success: true,
        data: Some(parse_calendar_view(&html)?),
        error: None,
    })
}
