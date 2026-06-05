use keyring::Entry;
use std::thread;
use std::time::Duration;

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
    ]
    .iter()
    .any(|needle| lowered.contains(needle))
}

pub fn set_password(user_id: &str, password: &str) -> Result<(), String> {
    let normalized_user_id = normalized_user_id(user_id);
    let entry = Entry::new(SERVICE_NAME, &normalized_user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;

    entry
        .set_password(password)
        .map_err(|e| format!("failed to set password in keyring: {e}"))?;

    Ok(())
}

pub fn get_password(user_id: &str) -> Result<String, String> {
    let normalized_user_id = normalized_user_id(user_id);
    let entry = Entry::new(SERVICE_NAME, &normalized_user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;

    entry
        .get_password()
        .map_err(|e| format!("failed to get password from keyring: {e}"))
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
    let normalized_user_id = normalized_user_id(user_id);
    let entry = Entry::new(SERVICE_NAME, &normalized_user_id)
        .map_err(|e| format!("failed to create keyring entry: {e}"))?;

    // ignore error if password doesn't exist
    let _ = entry.delete_credential();

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::is_missing_entry_error;

    #[test]
    fn detects_common_missing_entry_variants() {
        let cases = [
            "No matching entry found in secure storage",
            "Entry not found",
            "No such entry",
            "item not found in keychain",
            "No stored credentials were found",
            "The system cannot find the file specified",
        ];

        for case in cases {
            assert!(
                is_missing_entry_error(case),
                "expected missing-entry classification for: {case}"
            );
        }
    }

    #[test]
    fn does_not_misclassify_backend_failures() {
        let cases = [
            "Access is denied",
            "A specified logon session does not exist",
            "failed to connect to Secret Service",
            "permission denied while reading keyring",
        ];

        for case in cases {
            assert!(
                !is_missing_entry_error(case),
                "unexpected missing-entry classification for: {case}"
            );
        }
    }

    #[test]
    fn missing_entry_matching_is_case_insensitive() {
        assert!(is_missing_entry_error(
            "NO MATCHING ENTRY FOUND IN SECURE STORAGE"
        ));
    }

    #[test]
    fn test_keyring_integration() {
        let test_user = "test_user_deskly_123";
        let test_pass = "super_secure_pass_456";

        // Try setting password
        let set_res = super::set_password(test_user, test_pass);
        assert!(set_res.is_ok(), "set_password failed: {:?}", set_res);

        // Try getting password
        let get_res = super::get_password(test_user);
        assert!(get_res.is_ok(), "get_password failed: {:?}", get_res);
        assert_eq!(get_res.unwrap(), test_pass);

        // Try deleting password
        let del_res = super::delete_password(test_user);
        assert!(del_res.is_ok(), "delete_password failed: {:?}", del_res);
    }
}
