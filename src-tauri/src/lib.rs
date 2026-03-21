use tauri::Manager;

mod auth;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let auth_store = auth::init_auth_store(&app.handle());
            app.manage(auth_store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            auth::auth_login,
            auth::auth_logout,
            auth::auth_get_state,
            auth::auth_restore_session,
            auth::auth_set_tokens,
            auth::auth_get_tokens,
            auth::auth_clear_tokens,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
