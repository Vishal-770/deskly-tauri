use crate::auth::keyring;

#[tauri::command]
pub fn auth_keyring_set(username: String, password: String) -> Result<(), String> {
    keyring::set_password(&username, &password)
}
