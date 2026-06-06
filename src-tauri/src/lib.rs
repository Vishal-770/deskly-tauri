use tauri::Manager;
use tauri_plugin_notification::NotificationExt;

mod attendance;
mod auth;
mod content;
mod features;
mod feedback;
mod grades;
mod marks;
mod profile;
mod timetable;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn test_backend(app: tauri::AppHandle) -> String {
    // 1. Official Tauri cross-platform notification API (100% compatible with Windows, macOS, Linux, iOS, Android)
    let _ = app.notification()
        .builder()
        .title("Deskly Test Notification")
        .body("Backend connection active! Hello from the Tauri Rust backend.")
        .show();

    // 2. Linux development-time fallback (since Linux notification daemons block dev binaries lacking a registered .desktop launcher)
    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("notify-send")
            .args([
                "Deskly Test Notification",
                "Backend connection active! Hello from the Tauri Rust backend."
            ])
            .spawn();
    }

    "Backend connection active! Native OS popup notification sent.".to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let auth_store = auth::init_auth_store(&app.handle());
            app.manage(auth_store);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            test_backend,
            auth::auth_login,
            auth::auth_logout,
            auth::auth_get_state,
            auth::auth_get_credential_status,
            auth::auth_restore_session,
            auth::auth_set_tokens,
            auth::auth_get_tokens,
            auth::auth_clear_tokens,
            auth::auth_get_semester,
            auth::auth_set_semester,
            auth::auth_clear_semester,
            auth::auth_get_semesters,
            auth::auth_auto_relogin,
            auth::auth_keyring_set,
            auth::auth_keyring_get,
            auth::auth_keyring_delete,
            content::get_content_page,
            content::get_cgpa_page,
            attendance::attendance_get_semesters,
            attendance::attendance_get_current,
            attendance::attendance_get_detail,
            marks::marks_get_student_mark_view,
            features::academic_calendar_get,
            features::academic_calendar_get_view,
            features::mess_get_menu,
            features::laundry_get_schedule,
            features::contact_info_get,
            features::payment_receipts_get,
            features::payment_receipt_download,
            features::curriculum_get,
            features::curriculum_get_category_view,
            features::curriculum_download_syllabus,
            features::exam_schedule_get,
            features::hod_dean_details_get,
            timetable::timetable_get_courses,
            timetable::timetable_get_weekly,
            profile::profile_get_student_profile,
            grades::grades_get_history,
            feedback::feedback_get_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
