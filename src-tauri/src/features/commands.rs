use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use serde_json::Value;
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::auth::helpers::{
    auth_tokens_from_store, get_default_semester_id, selected_semester_id_from_store,
};

use super::parser::{
    parse_calendar_options, parse_calendar_view, parse_contact_details, parse_curriculum_categories,
    parse_curriculum_courses, parse_receipts,
};
use super::types::{
    CalendarOptionsResponse, CalendarViewResponse, ContactResponse, CurriculumCategoriesResponse,
    CurriculumCoursesResponse, LaundryEntry, LaundryResponse, MessMenuItem, MessResponse,
    ReceiptResponse, SyllabusData, SyllabusResponse,
};

#[tauri::command]
pub async fn academic_calendar_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<CalendarOptionsResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(CalendarOptionsResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let sem_id = match selected_semester_id_from_store(&store)? {
            Some(id) => id,
            None => get_default_semester_id(&tokens).await?,
        };

        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/getDateForSemesterPreview"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .form(&[
                ("_csrf", tokens.csrf.as_str()),
                ("paramReturnId", "getDateForSemesterPreview"),
                ("semSubId", sem_id.as_str()),
                ("authorizedID", tokens.authorized_id.as_str()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch academic calendar options: {e}"))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read academic calendar options html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_calendar_options(&html)?;
    };

    Ok(CalendarOptionsResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn academic_calendar_get_view(
    app: tauri::AppHandle,
    cal_date: String,
    store: State<'_, AuthStore>,
) -> Result<CalendarViewResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(CalendarViewResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read academic calendar view html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_calendar_view(&html)?;
    };

    Ok(CalendarViewResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

fn mess_file_for_type(mess_type: &str) -> Option<&'static str> {
    match mess_type {
        "Veg-mens" => Some("VITC-M-V.json"),
        "Non-Veg-mens" => Some("VITC-M-N.json"),
        "Special-mens" => Some("VITC-M-S.json"),
        "Veg-womens" => Some("VITC-W-V.json"),
        "Non-Veg-womens" => Some("VITC-W-N.json"),
        "Special-womens" => Some("VITC-W-S.json"),
        _ => None,
    }
}

fn laundry_file_for_block(block: &str) -> Option<&'static str> {
    match block {
        "A" => Some("VITC-A-L.json"),
        "B" => Some("VITC-B-L.json"),
        "CB" => Some("VITC-CB-L.json"),
        "CG" => Some("VITC-CG-L.json"),
        "D1" => Some("VITC-D1-L.json"),
        "D2" => Some("VITC-D2-L.json"),
        "E" => Some("VITC-E-L.json"),
        _ => None,
    }
}

#[tauri::command]
pub async fn mess_get_menu(mess_type: String) -> Result<MessResponse, String> {
    let file = match mess_file_for_type(&mess_type) {
        Some(file) => file,
        None => {
            return Ok(MessResponse {
                success: false,
                data: None,
                error: Some("Invalid mess type".to_string()),
            })
        }
    };

    let url = format!("https://kanishka-developer.github.io/unmessify/json/en/{file}");
    let client = build_http_client()?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch mess menu: {e}"))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse mess menu response json: {e}"))?;

    let mut data = Vec::new();
    if let Some(list) = json.get("list").and_then(|v| v.as_array()) {
        for item in list {
            data.push(MessMenuItem {
                id: item.get("Id").and_then(|v| v.as_i64()).unwrap_or(0),
                day: item
                    .get("Day")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                breakfast: item
                    .get("Breakfast")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                lunch: item
                    .get("Lunch")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                snacks: item
                    .get("Snacks")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                dinner: item
                    .get("Dinner")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
            });
        }
    }

    Ok(MessResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn laundry_get_schedule(block: String) -> Result<LaundryResponse, String> {
    let file = match laundry_file_for_block(&block) {
        Some(file) => file,
        None => {
            return Ok(LaundryResponse {
                success: false,
                data: None,
                error: Some("Invalid laundry block".to_string()),
            })
        }
    };

    let url = format!("https://kanishka-developer.github.io/unmessify/json/en/{file}");
    let client = build_http_client()?;
    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch laundry schedule: {e}"))?;

    let json: Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse laundry response json: {e}"))?;

    let mut data = Vec::new();
    if let Some(list) = json.get("list").and_then(|v| v.as_array()) {
        for item in list {
            data.push(LaundryEntry {
                id: item.get("Id").and_then(|v| v.as_i64()).unwrap_or(0),
                date: item
                    .get("Date")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string(),
                room_number: item
                    .get("RoomNumber")
                    .and_then(|v| v.as_str())
                    .map(|x| x.to_string()),
            });
        }
    }

    Ok(LaundryResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}


#[tauri::command]
pub async fn contact_info_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ContactResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(ContactResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
        let client = build_http_client()?;
        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/hrms/contactDetails"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .form(&[
                ("verifyMenu", "true"),
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("nocache", &format!("@{}", Utc::now().timestamp_millis())),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch contact details: {e}"))?;

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read contact details html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_contact_details(&html)?;
    };

    Ok(ContactResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn payment_receipts_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<ReceiptResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(ReceiptResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read receipts html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_receipts(&html)?;
    };

    Ok(ReceiptResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn curriculum_get(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
) -> Result<CurriculumCategoriesResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(CurriculumCategoriesResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read curriculum html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_curriculum_categories(&html)?;
    };

    Ok(CurriculumCategoriesResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}

#[tauri::command]
pub async fn curriculum_get_category_view(
    app: tauri::AppHandle,
    category_id: String,
    store: State<'_, AuthStore>,
) -> Result<CurriculumCoursesResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(CurriculumCoursesResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let data = loop {
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

        let html = response
            .text()
            .await
            .map_err(|e| format!("Failed to read curriculum category view html: {e}"))?;

        if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
            tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
            retry_count += 1;
            continue;
        }

        break parse_curriculum_courses(&html)?;
    };

    Ok(CurriculumCoursesResponse {
        success: true,
        data: Some(data),
        error: None,
    })
}
#[tauri::command]
pub async fn curriculum_download_syllabus(
    app: tauri::AppHandle,
    course_code: String,
    store: State<'_, AuthStore>,
) -> Result<SyllabusResponse, String> {
    let mut tokens = match auth_tokens_from_store(&store) {
        Ok(t) => t,
        Err(err) => {
            return Ok(SyllabusResponse {
                success: false,
                data: None,
                error: Some(err),
            })
        }
    };
    let mut retry_count = 0;

    let result = loop {
        let client = build_http_client()?;
        let response = client
            .post(format!(
                "{VTOP_BASE_URL}/vtop/courseSyllabusDownload1"
            ))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .form(&[
                ("authorizedID", tokens.authorized_id.as_str()),
                ("_csrf", tokens.csrf.as_str()),
                ("courseCode", course_code.as_str()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch syllabus: {e}"))?;

        // Check if it's an HTML response (session expired usually)
        let content_type = response.headers().get(CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or("")
            .to_string();

        if content_type.contains("text/html") {
            let html = response
                .text()
                .await
                .map_err(|e| format!("Failed to read syllabus error html: {e}"))?;

            if crate::auth::helpers::is_session_expired(&html) && retry_count < 1 {
                tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
                retry_count += 1;
                continue;
            }
            return Ok(SyllabusResponse {
                success: false,
                data: None,
                error: Some("Session expired or invalid response".to_string()),
            });
        }

        // It's binary data
        let filename = response.headers().get("content-disposition")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| {
                if let Some(pos) = s.find("filename=\"") {
                    let start = pos + 10;
                    if let Some(end) = s[start..].find('\"') {
                        return Some(s[start..start+end].to_string());
                    }
                }
                None
            })
            .unwrap_or_else(|| format!("syllabus_{}.zip", course_code));

        let bytes = response.bytes().await
            .map_err(|e| format!("Failed to read syllabus bytes: {e}"))?;
        
        use base64::{Engine as _, engine::general_purpose};
        let b64 = general_purpose::STANDARD.encode(&bytes);

        break (filename, content_type.to_string(), b64);
    };

    Ok(SyllabusResponse {
        success: true,
        data: Some(SyllabusData {
            filename: result.0,
            content_type: result.1,
            data: result.2,
        }),
        error: None,
    })
}
