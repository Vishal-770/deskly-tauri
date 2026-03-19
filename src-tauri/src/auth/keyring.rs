use keyring::Entry;

const SERVICE_NAME: &str = "Deskly";

pub fn set_password(user_id: &str, password: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;
    
    entry.set_password(password)
        .map_err(|e| format!("failed to set password in keyring: {e}"))?;
    
    Ok(())
}

pub fn get_password(user_id: &str) -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;
    
    entry.get_password()
        .map_err(|e| format!("failed to get password from keyring: {e}"))
}

pub fn delete_password(user_id: &str) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;
    
    // ignore error if password doesn't exist
    let _ = entry.delete_credential();
    
    Ok(())
}
