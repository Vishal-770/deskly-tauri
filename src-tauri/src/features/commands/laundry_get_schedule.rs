use serde_json::Value;

use crate::auth::http::build_http_client;
use crate::features::types::{LaundryEntry, LaundryResponse};

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
