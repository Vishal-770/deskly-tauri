use crate::auth::keyring;

#[tauri::command]
pub fn auth_keyring_get(username: String) -> Result<String, String> {
    keyring::get_password(&username)
}
