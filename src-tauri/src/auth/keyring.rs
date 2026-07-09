#[cfg(not(target_os = "android"))]
use keyring::Entry;
use std::thread;
use std::time::Duration;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[cfg(not(target_os = "android"))]
const SERVICE_NAME: &str = "Deskly";
const VERIFY_RETRIES: usize = 4;
const VERIFY_RETRY_DELAY_MS: u64 = 120;

fn normalized_user_id(user_id: &str) -> String {
    user_id.trim().to_string()
}

pub fn is_missing_entry_error(err: &str) -> bool {
    let lowered = err.to_lowercase();
    [
        "no matching entry",
        "entry not found",
        "no such entry",
        "not found in secure",
        "missing credential",
        "missing credentials",
        "could not be found",
        "item not found",
        "not found",
        "no password found",
        "no stored credentials",
        "cannot find",
        "element not found",
        "no matching entry in fallback store",
    ]
    .iter()
    .any(|needle| lowered.contains(needle))
}

// ─── Fallback File Store ──────────────────────────────────────────────────────

fn get_fallback_store_path() -> PathBuf {
    #[cfg(target_os = "android")]
    {
        PathBuf::from("/data/data/com.deskly.app/files/.keyring_store.json")
    }
    #[cfg(not(target_os = "android"))]
    {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_else(|_| ".".to_string());
        PathBuf::from(home).join(".deskly_keyring_store.json")
    }
}

fn load_fallback_store() -> HashMap<String, String> {
    let path = get_fallback_store_path();
    if !path.exists() {
        return HashMap::new();
    }
    let content = fs::read_to_string(path).unwrap_or_default();
    serde_json::from_str(&content).unwrap_or_default()
}

fn save_fallback_store(store: &HashMap<String, String>) -> Result<(), String> {
    let path = get_fallback_store_path();
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let content = serde_json::to_string(store)
        .map_err(|e| format!("failed to serialize fallback store: {e}"))?;
    fs::write(path, content)
        .map_err(|e| format!("failed to write fallback store: {e}"))?;
    Ok(())
}

fn get_fallback_password(user_id: &str) -> Result<String, String> {
    let store = load_fallback_store();
    store
        .get(&normalized_user_id(user_id))
        .cloned()
        .ok_or_else(|| "no matching entry in fallback store".to_string())
}

fn set_fallback_password(user_id: &str, password: &str) -> Result<(), String> {
    let mut store = load_fallback_store();
    store.insert(normalized_user_id(user_id), password.to_string());
    save_fallback_store(&store)
}

fn delete_fallback_password(user_id: &str) -> Result<(), String> {
    let mut store = load_fallback_store();
    store.remove(&normalized_user_id(user_id));
    save_fallback_store(&store)
}

// ─── Keyring Functions ────────────────────────────────────────────────────────

pub fn set_password(user_id: &str, password: &str) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        return set_fallback_password(user_id, password);
    }

    #[cfg(not(target_os = "android"))]
    {
        let normalized_user_id = normalized_user_id(user_id);
        match Entry::new(SERVICE_NAME, &normalized_user_id) {
            Ok(entry) => {
                if let Err(e) = entry.set_password(password) {
                    println!("[keyring] set_password failed: {}, falling back to file", e);
                    set_fallback_password(user_id, password)
                } else {
                    Ok(())
                }
            }
            Err(e) => {
                println!("[keyring] failed to create entry: {}, falling back to file", e);
                set_fallback_password(user_id, password)
            }
        }
    }
}

pub fn get_password(user_id: &str) -> Result<String, String> {
    #[cfg(target_os = "android")]
    {
        return get_fallback_password(user_id);
    }

    #[cfg(not(target_os = "android"))]
    {
        let normalized_user_id = normalized_user_id(user_id);
        match Entry::new(SERVICE_NAME, &normalized_user_id) {
            Ok(entry) => match entry.get_password() {
                Ok(password) => Ok(password),
                Err(e) => {
                    let err_str = e.to_string();
                    if is_missing_entry_error(&err_str) {
                        Err(err_str)
                    } else {
                        println!("[keyring] get_password failed: {}, falling back to file", err_str);
                        get_fallback_password(user_id)
                    }
                }
            },
            Err(e) => {
                println!("[keyring] failed to create entry: {}, falling back to file", e);
                get_fallback_password(user_id)
            }
        }
    }
}

pub fn get_password_with_retry(user_id: &str) -> Result<String, String> {
    for attempt in 1..=VERIFY_RETRIES {
        match get_password(user_id) {
            Ok(password) => return Ok(password),
            Err(err) if attempt < VERIFY_RETRIES && is_missing_entry_error(&err) => {
                thread::sleep(Duration::from_millis(VERIFY_RETRY_DELAY_MS));
            }
            Err(err) => return Err(err),
        }
    }

    Err("failed to get password from keyring after retry exhaustion".to_string())
}

pub fn delete_password(user_id: &str) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        return delete_fallback_password(user_id);
    }

    #[cfg(not(target_os = "android"))]
    {
        let normalized_user_id = normalized_user_id(user_id);
        let _ = delete_fallback_password(user_id);
        if let Ok(entry) = Entry::new(SERVICE_NAME, &normalized_user_id) {
            let _ = entry.delete_credential();
        }
        Ok(())
    }
}
