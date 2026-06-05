use crate::auth::keyring;

#[tauri::command]
pub fn auth_keyring_delete(username: String) -> Result<(), String> {
    keyring::delete_password(&username)
}
