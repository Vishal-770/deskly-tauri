use serde_json::Value;

use crate::auth::http::build_http_client;
use crate::features::types::{MessMenuItem, MessResponse};

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
