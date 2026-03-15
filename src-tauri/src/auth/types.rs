use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Semester {
    pub id: String,
    pub name: String,
}

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
pub struct PersistedAuth {
    #[serde(default)]
    pub state: Option<AuthState>,
    #[serde(default)]
    pub tokens: Option<AuthTokens>,
    #[serde(default)]
    pub semester: Option<Semester>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub state: AuthState,
    pub tokens: AuthTokens,
}
