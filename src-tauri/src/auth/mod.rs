mod captcha;
pub mod commands;
mod constants;
mod http;
mod parser;
mod store;
pub mod types;

// Re-export what lib.rs needs for setup
pub use store::init_auth_store;

// Re-export all Tauri commands — wildcard is required because the
// #[tauri::command] macro generates hidden items (__cmd__*, __cmd_meta__*)
// that `tauri::generate_handler!` expects at the same module path.
pub use commands::*;
