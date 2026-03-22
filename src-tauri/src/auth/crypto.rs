use aes_gcm::aead::{Aead, KeyInit};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::Engine;
use rand::rngs::OsRng;
use rand::RngCore;

use super::keyring;

const MASTER_KEY_ACCOUNT: &str = "__deskly_master_key_v1__";
const ENCRYPTED_PREFIX: &str = "v1";

fn get_or_create_master_key() -> Result<[u8; 32], String> {
    match keyring::get_password_with_retry(MASTER_KEY_ACCOUNT) {
        Ok(encoded) => {
            let decoded = base64::engine::general_purpose::STANDARD
                .decode(encoded)
                .map_err(|e| format!("failed to decode master key: {e}"))?;
            if decoded.len() != 32 {
                return Err("invalid master key length".to_string());
            }
            let mut key = [0u8; 32];
            key.copy_from_slice(&decoded);
            Ok(key)
        }
        Err(err) if keyring::is_missing_entry_error(&err) => {
            let mut key = [0u8; 32];
            OsRng.fill_bytes(&mut key);

            let encoded = base64::engine::general_purpose::STANDARD.encode(key);
            keyring::set_password(MASTER_KEY_ACCOUNT, &encoded)
                .map_err(|e| format!("failed to persist master key: {e}"))?;

            Ok(key)
        }
        Err(err) => Err(format!("failed to access secure master key storage: {err}")),
    }
}

pub fn encrypt_password(plain_text: &str) -> Result<String, String> {
    let key = get_or_create_master_key()?;
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("failed to initialize cipher: {e}"))?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plain_text.as_bytes())
        .map_err(|e| format!("failed to encrypt password: {e}"))?;

    let nonce_b64 = base64::engine::general_purpose::STANDARD.encode(nonce_bytes);
    let ciphertext_b64 = base64::engine::general_purpose::STANDARD.encode(ciphertext);

    Ok(format!("{ENCRYPTED_PREFIX}:{nonce_b64}:{ciphertext_b64}"))
}

pub fn decrypt_password(stored: &str) -> Result<String, String> {
    // Backward compatibility for older plaintext persisted values.
    if !stored.starts_with(&format!("{ENCRYPTED_PREFIX}:")) {
        return Ok(stored.to_string());
    }

    let mut parts = stored.splitn(3, ':');
    let prefix = parts.next().unwrap_or_default();
    let nonce_b64 = parts
        .next()
        .ok_or_else(|| "invalid encrypted password format (nonce missing)".to_string())?;
    let ciphertext_b64 = parts
        .next()
        .ok_or_else(|| "invalid encrypted password format (ciphertext missing)".to_string())?;

    if prefix != ENCRYPTED_PREFIX {
        return Err("unsupported encrypted password version".to_string());
    }

    let nonce_bytes = base64::engine::general_purpose::STANDARD
        .decode(nonce_b64)
        .map_err(|e| format!("failed to decode nonce: {e}"))?;
    if nonce_bytes.len() != 12 {
        return Err("invalid nonce length".to_string());
    }

    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(ciphertext_b64)
        .map_err(|e| format!("failed to decode ciphertext: {e}"))?;

    let key = get_or_create_master_key()?;
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("failed to initialize cipher: {e}"))?;

    let nonce = Nonce::from_slice(&nonce_bytes);
    let plain = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|e| format!("failed to decrypt password: {e}"))?;

    String::from_utf8(plain).map_err(|e| format!("invalid utf-8 in decrypted password: {e}"))
}
