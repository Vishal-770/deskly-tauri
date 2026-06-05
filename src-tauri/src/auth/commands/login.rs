use chrono::Utc;
use reqwest::header::{CONTENT_TYPE, COOKIE, LOCATION, REFERER};
use tauri::{AppHandle, State};

use crate::attendance::parser::extract_semesters_from_html;
use crate::auth::captcha::{decode_data_url_bytes, solve_captcha_from_image_bytes};
use crate::auth::constants::VTOP_BASE_URL;
use crate::auth::crypto;
use crate::auth::http::{
    build_http_client, collect_set_cookies, get_with_redirect_follow, merge_cookies,
    split_cookie_header,
};
use crate::auth::keyring;
use crate::auth::parser::{
    classify_login_error, extract_auth_tokens_from_dashboard, extract_captcha_src,
    extract_csrf_from_setup, is_recaptcha_page,
};
use crate::auth::store::{now_unix_ms, save_to_disk, AuthStore};
use crate::auth::types::{AuthState, AuthTokens, LoginResponse, Semester};

pub(crate) async fn fetch_semesters(tokens: &AuthTokens) -> Result<Vec<Semester>, String> {
    let client = build_http_client()?;
    let response = client
        .post(format!(
            "{VTOP_BASE_URL}/vtop/academics/common/StudentTimeTableChn"
        ))
        .header(COOKIE, tokens.cookies.clone())
        .header(CONTENT_TYPE, "application/x-www-form-urlencoded")
        .header(REFERER, format!("{VTOP_BASE_URL}/vtop/content"))
        .form(&[
            ("verifyMenu", "true"),
            ("authorizedID", tokens.authorized_id.as_str()),
            ("_csrf", tokens.csrf.as_str()),
            ("nocache", &Utc::now().timestamp_millis().to_string()),
        ])
        .send()
        .await
        .map_err(|e| format!("failed to fetch semester list: {e}"))?;

    let html = response
        .text()
        .await
        .map_err(|e| format!("failed to read semester list html: {e}"))?;

    let semesters = extract_semesters_from_html(&html)?;
    Ok(semesters
        .into_iter()
        .map(|semester| Semester {
            id: semester.id,
            name: semester.name,
        })
        .collect())
}

pub async fn internal_login(username: &str, password: &str) -> Result<AuthTokens, String> {
    let client = build_http_client()?;

    // Mirror Deskly behavior: retry until VTOP serves DEFAULT image captcha (not reCAPTCHA).
    let mut csrf: Option<String> = None;
    let mut session_cookie_header: Option<String> = None;
    let mut captcha_image_bytes: Option<Vec<u8>> = None;

    for attempt in 1..=10 {
        let setup_response = get_with_redirect_follow(
            &client,
            &format!("{VTOP_BASE_URL}/vtop/prelogin/setup"),
            None,
            3,
        )
        .await
        .map_err(|e| format!("prelogin setup request failed: {e}"))?;

        let setup_cookies = collect_set_cookies(&setup_response);
        let setup_html = setup_response
            .text()
            .await
            .map_err(|e| format!("failed to read prelogin setup page: {e}"))?;

        if setup_html.trim().is_empty() {
            if attempt < 10 {
                continue;
            }
            return Err("prelogin setup page returned empty body after retries".to_string());
        }

        let this_csrf = match extract_csrf_from_setup(&setup_html) {
            Ok(value) => value,
            Err(e) if attempt < 10 => {
                let _ = e;
                continue;
            }
            Err(e) => return Err(e),
        };

        let cookie_header = merge_cookies(&setup_cookies, &[]);
        let setup_post_response = client
            .post(format!("{VTOP_BASE_URL}/vtop/prelogin/setup"))
            .header(COOKIE, cookie_header.clone())
            .header("content-type", "application/x-www-form-urlencoded")
            .body(format!("_csrf={this_csrf}&flag=VTOP"))
            .send()
            .await
            .map_err(|e| format!("prelogin setup post failed: {e}"))?;

        let setup_post_cookies = collect_set_cookies(&setup_post_response);
        let this_session_cookie_header = merge_cookies(&setup_cookies, &setup_post_cookies);

        let login_page = get_with_redirect_follow(
            &client,
            &format!("{VTOP_BASE_URL}/vtop/login"),
            Some(&this_session_cookie_header),
            3,
        )
        .await
        .map_err(|e| format!("login page request failed: {e}"))?;

        let login_page_html = login_page
            .text()
            .await
            .map_err(|e| format!("failed to read login page: {e}"))?;

        let captcha_src = match extract_captcha_src(&login_page_html) {
            Ok(src) => src,
            Err(image_err) => {
                if is_recaptcha_page(&login_page_html)? {
                    if attempt < 10 {
                        std::thread::sleep(std::time::Duration::from_millis(800));
                        continue;
                    }
                    return Err(
                        "captcha image source not found: page is using reCAPTCHA after retries"
                            .to_string(),
                    );
                }

                if attempt < 10 {
                    std::thread::sleep(std::time::Duration::from_millis(800));
                    continue;
                }

                return Err(image_err);
            }
        };

        let this_captcha_image_bytes = if captcha_src.starts_with("data:image") {
            decode_data_url_bytes(&captcha_src)?
        } else {
            let captcha_url = reqwest::Url::parse(VTOP_BASE_URL)
                .map_err(|e| format!("invalid base url: {e}"))?
                .join(&captcha_src)
                .map_err(|e| format!("invalid captcha url: {e}"))?;

            client
                .get(captcha_url)
                .header(COOKIE, this_session_cookie_header.clone())
                .send()
                .await
                .map_err(|e| format!("captcha request failed: {e}"))?
                .bytes()
                .await
                .map_err(|e| format!("failed to read captcha bytes: {e}"))?
                .to_vec()
        };

        csrf = Some(this_csrf);
        session_cookie_header = Some(this_session_cookie_header);
        captcha_image_bytes = Some(this_captcha_image_bytes);
        break;
    }

    let csrf = csrf.ok_or_else(|| "failed to get csrf for login".to_string())?;
    let session_cookie_header =
        session_cookie_header.ok_or_else(|| "failed to establish session cookies".to_string())?;
    let captcha_image_bytes =
        captcha_image_bytes.ok_or_else(|| "failed to fetch image captcha".to_string())?;

    let captcha_text = solve_captcha_from_image_bytes(&captcha_image_bytes)?;

    let login_form = format!(
        "_csrf={}&username={}&password={}&captchaStr={}",
        urlencoding::encode(&csrf),
        urlencoding::encode(username.trim()),
        urlencoding::encode(password.trim()),
        urlencoding::encode(&captcha_text)
    );

    let login_response = client
        .post(format!("{VTOP_BASE_URL}/vtop/login"))
        .header(COOKIE, session_cookie_header.clone())
        .header("content-type", "application/x-www-form-urlencoded")
        .body(login_form)
        .send()
        .await
        .map_err(|e| format!("login request failed: {e}"))?;

    let login_set_cookies = collect_set_cookies(&login_response);
    let all_cookie_header = merge_cookies(
        &split_cookie_header(&session_cookie_header),
        &login_set_cookies,
    );

    let dashboard_response = if login_response.status().is_redirection() {
        let location = login_response
            .headers()
            .get(LOCATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| "login redirect location missing".to_string())?;

        let url = reqwest::Url::parse(VTOP_BASE_URL)
            .map_err(|e| format!("invalid base url: {e}"))?
            .join(location)
            .map_err(|e| format!("invalid redirect url: {e}"))?;

        get_with_redirect_follow(&client, url.as_ref(), Some(&all_cookie_header), 5)
            .await
            .map_err(|e| format!("failed to load dashboard after login: {e}"))?
    } else {
        get_with_redirect_follow(
            &client,
            &format!("{VTOP_BASE_URL}/vtop/open/page"),
            Some(&all_cookie_header),
            5,
        )
        .await
        .map_err(|e| format!("failed to load open page after login: {e}"))?
    };

    let dashboard_status = dashboard_response.status();
    let dashboard_url = dashboard_response.url().to_string();
    let dashboard_html = dashboard_response
        .text()
        .await
        .map_err(|e| format!("failed to read dashboard html: {e}"))?;

    if dashboard_html.trim().is_empty() {
        return Err(format!(
            "Login failed: empty dashboard response (status: {}, url: {})",
            dashboard_status, dashboard_url
        ));
    }

    let lowered = dashboard_html.to_lowercase();
    let is_authorized = lowered.contains("authorizedidx") || lowered.contains("authorizedid");
    if !is_authorized {
        if let Some(msg) = classify_login_error(&dashboard_html) {
            return Err(msg);
        }
        return Err("Login failed: not authorized. Please check your credentials.".to_string());
    }

    let (new_csrf, authorized_id) = extract_auth_tokens_from_dashboard(&dashboard_html)?;

    Ok(AuthTokens {
        authorized_id,
        csrf: new_csrf,
        cookies: all_cookie_header,
    })
}

#[tauri::command]
pub async fn auth_login(
    app: AppHandle,
    store: State<'_, AuthStore>,
    username: String,
    password: String,
) -> Result<LoginResponse, String> {
    if username.trim().is_empty() {
        return Err("username is required".to_string());
    }

    let tokens = internal_login(&username, &password).await?;

    let selected_semester = fetch_semesters(&tokens)
        .await
        .ok()
        .and_then(|semesters| semesters.first().cloned());

    let auth_state = AuthState {
        user_id: username.trim().to_string(),
        logged_in: true,
        last_login: now_unix_ms(),
    };

    let mut guard = store
        .inner
        .lock()
        .map_err(|_| "failed to lock auth store".to_string())?;

    let encrypted_password = crypto::encrypt_password(&password)
        .map_err(|e| format!("secure credential encryption failed: {e}"))?;

    guard.state = Some(auth_state.clone());
    guard.tokens = Some(tokens.clone());
    guard.semester = selected_semester;
    guard.password_encrypted = Some(encrypted_password);
    // Best-effort keyring write for compatibility; persistent auth password is authoritative.
    let _ = keyring::set_password(username.trim(), &password);
    save_to_disk(&app, &guard)?;

    Ok(LoginResponse {
        state: auth_state,
        tokens,
    })
}
