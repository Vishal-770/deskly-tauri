use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;
use tauri_plugin_notification::NotificationExt;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::{
    auth_tokens_from_store, is_auth_retryable_status,
};
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;

use crate::features::types::{SyllabusData, SyllabusResponse};

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
            .post(format!("{VTOP_BASE_URL}/vtop/courseSyllabusDownload1"))
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

        if is_auth_retryable_status(response.status()) {
            if retry_count < 1 {
                tokens = crate::auth::helpers::perform_auto_relogin(&app, &store).await?;
                retry_count += 1;
                continue;
            }

            return Ok(SyllabusResponse {
                success: false,
                data: None,
                error: Some("Authentication failed after auto-relogin retry".to_string()),
            });
        }

        // Check if it's an HTML response (session expired usually)
        let content_type = response
            .headers()
            .get(CONTENT_TYPE)
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
        let filename = response
            .headers()
            .get("content-disposition")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| {
                if let Some(pos) = s.find("filename=\"") {
                    let start = pos + 10;
                    if let Some(end) = s[start..].find('\"') {
                        return Some(s[start..start + end].to_string());
                    }
                }
                None
            })
            .unwrap_or_else(|| format!("syllabus_{}.zip", course_code));

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read syllabus bytes: {e}"))?;

        break (filename, bytes);
    };

    #[cfg(mobile)]
    {
        use tauri::Manager;
        let downloads_dir = app
            .path()
            .download_dir()
            .map_err(|e| format!("Failed to resolve downloads directory: {e}"))?;
        let file_path = downloads_dir.join(&result.0);

        std::fs::write(&file_path, &result.1)
            .map_err(|e| format!("Failed to save syllabus to disk: {e}"))?;

        let save_path = file_path.to_string_lossy().to_string();

        let _ = app.notification()
            .builder()
            .title("Syllabus Downloaded")
            .body(format!("Syllabus successfully saved to: {}", result.0))
            .show();

        Ok(SyllabusResponse {
            success: true,
            data: Some(SyllabusData {
                filename: result.0,
                save_path,
            }),
            error: None,
        })
    }

    #[cfg(desktop)]
    {
        use rfd::FileDialog;

        let filename = &result.0;
        let ext = std::path::Path::new(filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("zip");

        let path = FileDialog::new()
            .set_file_name(filename)
            .add_filter("Syllabus File", &[ext])
            .save_file();

        if let Some(path) = path {
            std::fs::write(&path, &result.1)
                .map_err(|e| format!("Failed to save syllabus to disk: {e}"))?;

            let save_path = path.to_string_lossy().to_string();
            let saved_filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();

            // Trigger a native notification
            let _ = app.notification()
                .builder()
                .title("Syllabus Saved")
                .body(format!("Syllabus successfully saved to: {}", saved_filename))
                .show();

            // Linux development notification fallback
            #[cfg(target_os = "linux")]
            {
                let _ = std::process::Command::new("notify-send")
                    .args([
                        "Syllabus Saved",
                        &format!("Syllabus successfully saved to: {}", saved_filename)
                    ])
                    .spawn();
            }

            Ok(SyllabusResponse {
                success: true,
                data: Some(SyllabusData {
                    filename: saved_filename,
                    save_path,
                }),
                error: None,
            })
        } else {
            Ok(SyllabusResponse {
                success: false,
                data: None,
                error: Some("Save cancelled".to_string()),
            })
        }
    }
}
