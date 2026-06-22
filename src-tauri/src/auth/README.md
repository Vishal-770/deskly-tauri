# Authentication & Session Module

This module manages student credentials, VTOP login flows, session persistence, automatic relogin operations, OS-level secure storage integration, and offline CAPTCHA solving.

## File Structure

- `types.rs`: Struct definitions for credentials, auth tokens (CSRF, cookies), state records, and responses.
- `constants.rs`: Auth constants, endpoints, and captcha characters label text mapping.
- `captcha.rs`: Native neural classification CAPTCHA solver utilizing weights and biases.
- `captcha_model.json`: Pre-trained weights and biases for binarized image OCR classification.
- `crypto.rs`: Cryptographic utilities to encrypt/decrypt strings locally when system-level keyring storage is unavailable.
- `keyring.rs`: Integrates with the host OS keyring (macOS Keychain, Windows Credential Manager, Linux Secret Service API) via the `keyring` crate to store passwords securely under the service name "Deskly". Includes retry/recovery logic.
- `store.rs`: Manages serialization and persistence of local auth tokens, CSRF values, profile configurations, and state.
- `http.rs`: Internal HTTP clients with customized user-agent headers and cookie engine handling for remote VTOP queries.
- `parser.rs`: Scrapes the VTOP landing, login, and dashboard pages to verify session state, extract active semesters, and extract base64 CAPTCHA data.
- `helpers.rs`: Core VTOP request dispatchers, token validators, and session-check handlers.
- `commands/`:
  - Contains Tauri commands for logging in, auto-relogin, session restoring, token querying/setting, keyring management, and semester tracking.
- `mod.rs`: Registers submodules and starts setup operations.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `auth_login`
- **Rust Function**: `auth_login`
- **Description**: Performs a manual login to VTOP using username, password, and solved CAPTCHA. Saves credentials securely in the OS keyring on success.
- **Parameters**:
  - `reg_no`: `String`
  - `password`: `String`
  - `captcha`: `String`
- **Return Type**: `Result<LoginResponse, String>`

### 2. `auth_logout`
- **Rust Function**: `auth_logout`
- **Description**: Logs out of VTOP, invalidates the session, and purges saved tokens (retaining keyring credentials).
- **Return Type**: `Result<(), String>`

### 3. `auth_get_state`
- **Rust Function**: `auth_get_state`
- **Description**: Retrieves the active `AuthState` record.
- **Return Type**: `Result<Option<AuthState>, String>`

### 4. `auth_get_credential_status`
- **Rust Function**: `auth_get_credential_status`
- **Description**: Check if secure credentials already exist for a username in the system keyring.
- **Parameters**:
  - `reg_no`: `String`
- **Return Type**: `Result<CredentialStatus, String>`

### 5. `auth_restore_session`
- **Rust Function**: `auth_restore_session`
- **Description**: Tries to restore a session using cached cookies. Runs a session check against VTOP.
- **Return Type**: `Result<LoginResponse, String>`

### 6. `auth_set_tokens` / `auth_get_tokens` / `auth_clear_tokens`
- **Rust Functions**: `auth_set_tokens`, `auth_get_tokens`, `auth_clear_tokens`
- **Description**: Manually updates, queries, or clears VTOP session tokens (cookies, CSRF).
- **Return Type**: `Result<(), String>` (or `Result<Option<AuthTokens>, String>`)

### 7. `auth_get_semester` / `auth_set_semester` / `auth_clear_semester` / `auth_get_semesters`
- **Rust Functions**: `auth_get_semester`, `auth_set_semester`, `auth_clear_semester`, `auth_get_semesters`
- **Description**: Utilities to read, write, reset, or fetch active/available semester configurations.

### 8. `auth_auto_relogin`
- **Rust Function**: `auth_auto_relogin`
- **Description**: Silently triggers a background login action using credentials saved in the OS Keyring. Ideal for recovering from session timeouts.
- **Return Type**: `Result<LoginResponse, String>`

### 9. `auth_keyring_set` / `auth_keyring_get` / `auth_keyring_delete`
- **Rust Functions**: `auth_keyring_set`, `auth_keyring_get`, `auth_keyring_delete`
- **Description**: Direct bindings to set, retrieve, or purge credentials from the OS keyring securely.

## CAPTCHA Solver Details

The `solve_captcha_from_image_bytes` function inside `captcha.rs` performs base64 image decoding, loads the pixel buffer using the `image` crate, calculates color saturation vectors, segments the image into 6 character blocks, binarizes pixel values (using average block brightness thresholds), and runs a single-layer feed-forward calculation against weights and biases defined in `captcha_model.json` to predict character labels.
This achieves highly accurate, offline CAPTCHA solving in less than 5ms without needing external network API requests.
