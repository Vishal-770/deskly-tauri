use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthState {
    pub user_id: String,
    pub logged_in: bool,
    pub last_login: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthTokens {
    #[serde(rename = "authorizedID")]
    pub authorized_id: String,
    pub csrf: String,
    pub cookies: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PersistedAuth {
    state: Option<AuthState>,
    tokens: Option<AuthTokens>,
}

pub struct AuthStore {
    inner: Mutex<PersistedAuth>,
}

impl AuthStore {
    pub fn new(initial: PersistedAuth) -> Self {
        Self {
            inner: Mutex::new(initial),
        }
    }
}

fn auth_file_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("failed to resolve app data dir: {e}"))?;

    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("failed to create app data dir: {e}"))?;

    Ok(app_data_dir.join("auth_state.json"))
}

fn load_from_disk(app: &AppHandle) -> PersistedAuth {
    let path = match auth_file_path(app) {
        Ok(path) => path,
        Err(_) => return PersistedAuth::default(),
    };

    if !path.exists() {
        return PersistedAuth::default();
    }

    let content = match fs::read_to_string(path) {
        Ok(content) => content,
        Err(_) => return PersistedAuth::default(),
    };

    serde_json::from_str::<PersistedAuth>(&content).unwrap_or_default()
}

fn save_to_disk(app: &AppHandle, data: &PersistedAuth) -> Result<(), String> {
    let path = auth_file_path(app)?;
    let content = serde_json::to_string_pretty(data)
        .map_err(|e| format!("failed to serialize auth state: {e}"))?;

    fs::write(path, content).map_err(|e| format!("failed to write auth state: {e}"))
}

fn now_unix_ms() -> i64 {
    match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis() as i64,
        Err(_) => 0,
    }
}

pub fn init_auth_store(app: &AppHandle) -> AuthStore {
    AuthStore::new(load_from_disk(app))
}

#[tauri::command]
pub fn auth_login(
    app: AppHandle,
    store: State<AuthStore>,
    username: String,
    password: String,
) -> Result<AuthState, String> {
    if username.trim().is_empty() {
        return Err("username is required".to_string());
    }

    if password.trim().is_empty() {
        return Err("password is required".to_string());
    }

    let auth_state = AuthState {
        user_id: username.trim().to_string(),
        logged_in: true,
        last_login: now_unix_ms(),
    };

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.state = Some(auth_state.clone());
    save_to_disk(&app, &guard)?;

    Ok(auth_state)
}

#[tauri::command]
pub fn auth_logout(app: AppHandle, store: State<AuthStore>) -> Result<bool, String> {
    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.state = None;
    guard.tokens = None;
    save_to_disk(&app, &guard)?;

    Ok(true)
}

#[tauri::command]
pub fn auth_get_state(store: State<AuthStore>) -> Result<Option<AuthState>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    Ok(guard.state.clone())
}

#[tauri::command]
pub fn auth_restore_session(
    app: AppHandle,
    store: State<AuthStore>,
) -> Result<Option<AuthState>, String> {
    let persisted = load_from_disk(&app);

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    *guard = persisted;
    Ok(guard.state.clone())
}

#[tauri::command]
pub fn auth_set_tokens(
    app: AppHandle,
    store: State<AuthStore>,
    tokens: AuthTokens,
) -> Result<bool, String> {
    if tokens.authorized_id.trim().is_empty() {
        return Err("authorizedID is required".to_string());
    }

    if tokens.csrf.trim().is_empty() {
        return Err("csrf is required".to_string());
    }

    if tokens.cookies.trim().is_empty() {
        return Err("cookies is required".to_string());
    }

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.tokens = Some(tokens);
    save_to_disk(&app, &guard)?;

    Ok(true)
}

#[tauri::command]
pub fn auth_get_tokens(store: State<AuthStore>) -> Result<Option<AuthTokens>, String> {
    let guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    Ok(guard.tokens.clone())
}

#[tauri::command]
pub fn auth_clear_tokens(app: AppHandle, store: State<AuthStore>) -> Result<bool, String> {
    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    guard.tokens = None;
    save_to_disk(&app, &guard)?;

    Ok(true)
}

