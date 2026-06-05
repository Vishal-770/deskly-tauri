use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, REFERER};
use tauri::State;

use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::helpers::response_text_with_auth_retry;
use crate::auth::http::build_http_client;
use crate::auth::store::AuthStore;
use crate::features::types::{ReceiptDownloadData, ReceiptDownloadResponse};

#[tauri::command]
pub async fn payment_receipt_download(
    app: tauri::AppHandle,
    store: State<'_, AuthStore>,
    receit_no: String,
    applno: String,
) -> Result<ReceiptDownloadResponse, String> {
    let html = crate::with_auto_relogin!(app, store, tokens, {
        let client = build_http_client()?;
        
        let gmt_time = Utc::now().format("%a, %d %b %Y %H:%M:%S GMT").to_string();

        let response = client
            .post(format!("{VTOP_BASE_URL}/vtop/finance/dupReceiptNewP2P"))
            .header(COOKIE, tokens.cookies.clone())
            .header(CONTENT_TYPE, "application/x-www-form-urlencoded; charset=UTF-8")
            .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
            .header("X-Requested-With", "XMLHttpRequest")
            .form(&[
                ("_csrf", tokens.csrf.as_str()),
                ("receitNo", receit_no.as_str()),
                ("applno", applno.as_str()),
                ("registerNumber", tokens.authorized_id.as_str()),
                ("x", gmt_time.as_str()),
                ("authorizedID", tokens.authorized_id.as_str()),
            ])
            .send()
            .await
            .map_err(|e| format!("Failed to fetch duplicate receipt: {e}"))?;

        response_text_with_auth_retry(response, "Failed to read duplicate receipt html").await
    })?;

    use tauri::Manager;
    let downloads_dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("Failed to resolve downloads directory: {e}"))?;
    
    let clean_receipt_no = receit_no.replace('/', "_");
    let filename = format!("receipt_{}.html", clean_receipt_no);
    let file_path = downloads_dir.join(&filename);

    let full_html = format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Payment Receipt - {clean_receipt_no}</title>
    <!-- Load styles dynamically for online viewing -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/admin-lte/2.4.18/css/AdminLTE.min.css">
    <style>
        /* Fallback styling for offline viewing */
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f4f6f9;
            padding: 30px 15px;
            color: #333;
        }}
        .box {{
            background: #fff;
            border-radius: 6px;
            margin-bottom: 20px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            padding: 20px;
            border-top: 3px solid #d2d6de;
        }}
        .box.box-solid {{
            border-top: 0;
        }}
        .box-header {{
            color: #444;
            display: block;
            padding: 10px 0;
            position: relative;
            border-bottom: 1px solid #f4f4f4;
            margin-bottom: 15px;
        }}
        .table {{
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }}
        .table-bordered th, .table-bordered td {{
            border: 1px solid #ddd !important;
            padding: 10px;
            text-align: left;
        }}
        .text-center {{ text-align: center; }}
        .pull-right {{ float: right; }}
        @media print {{
            body {{ background: #fff; padding: 0; }}
            .box {{ border: 0; box-shadow: none; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="row">
            {html}
        </div>
    </div>
</body>
</html>"#,
        clean_receipt_no = clean_receipt_no,
        html = html
    );

    std::fs::write(&file_path, &full_html)
        .map_err(|e| format!("Failed to save receipt to disk: {e}"))?;

    let save_path = file_path.to_string_lossy().to_string();

    // Open the saved HTML file in the default OS browser/handler
    use tauri_plugin_opener::OpenerExt;
    let _ = app.opener().open_path(&save_path, None::<String>);

    Ok(ReceiptDownloadResponse {
        success: true,
        data: Some(ReceiptDownloadData {
            filename,
            save_path,
        }),
        error: None,
    })
}

