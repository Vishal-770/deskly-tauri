use scraper::{Html, Selector};

fn selector(input: &str) -> Result<Selector, String> {
    Selector::parse(input).map_err(|e| format!("failed to parse selector '{input}': {e}"))
}

fn find_hidden_input_value(html: &str, name: &str) -> Option<String> {
    let marker = format!("name=\"{name}\"");
    let idx = html.find(&marker)?;
    let tail = &html[idx..];

    // Try double-quoted value first.
    if let Some(v_idx) = tail.find("value=\"") {
        let value_start = v_idx + "value=\"".len();
        let rest = &tail[value_start..];
        let end = rest.find('"')?;
        return Some(rest[..end].to_string());
    }

    // Then single-quoted value.
    if let Some(v_idx) = tail.find("value='") {
        let value_start = v_idx + "value='".len();
        let rest = &tail[value_start..];
        let end = rest.find('\'')?;
        return Some(rest[..end].to_string());
    }

    None
}

pub fn extract_csrf_from_setup(html: &str) -> Result<String, String> {
    let doc = Html::parse_document(html);

    let selectors = [
        "#stdForm input[name='_csrf']",
        "#stdForm input[name=_csrf]",
        "input[name='_csrf']",
        "input[name=_csrf]",
    ];

    for css in selectors {
        let s = selector(css)?;
        if let Some(value) = doc
            .select(&s)
            .next()
            .and_then(|n| n.value().attr("value"))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
        {
            return Ok(value);
        }
    }

    if let Some(value) = find_hidden_input_value(html, "_csrf") {
        if !value.trim().is_empty() {
            return Ok(value);
        }
    }

    let snippet = html.chars().take(240).collect::<String>();
    Err(format!(
        "csrf not found in prelogin setup page (snippet: {:?})",
        snippet
    ))
}

pub fn extract_captcha_src(html: &str) -> Result<String, String> {
    let doc = Html::parse_document(html);

    let image_selectors = [
        "#captchaBlock img",
        "img#captchaRefresh",
        "img[id*='captcha']",
        "img[src*='captcha']",
        "img[data-src*='captcha']",
    ];

    for css in image_selectors {
        let s = selector(css)?;
        if let Some(node) = doc.select(&s).next() {
            if let Some(src) = node.value().attr("src") {
                let src = src.trim();
                if !src.is_empty() {
                    return Ok(src.to_string());
                }
            }

            if let Some(src) = node.value().attr("data-src") {
                let src = src.trim();
                if !src.is_empty() {
                    return Ok(src.to_string());
                }
            }
        }
    }

    let snippet = html.chars().take(400).collect::<String>();
    Err(format!(
        "captcha image source not found (snippet: {:?})",
        snippet
    ))
}

pub fn is_recaptcha_page(html: &str) -> Result<bool, String> {
    let doc = Html::parse_document(html);
    let recaptcha_selectors = [
        "input#gResponse",
        "div.g-recaptcha",
        "textarea[name='g-recaptcha-response']",
        "iframe[src*='recaptcha']",
    ];
    for css in recaptcha_selectors {
        let s = selector(css)?;
        if doc.select(&s).next().is_some() {
            return Ok(true);
        }
    }
    Ok(false)
}

pub fn extract_auth_tokens_from_dashboard(html: &str) -> Result<(String, String), String> {
    let doc = Html::parse_document(html);

    let csrf = {
        let csrf_selector = selector("input[name='_csrf']")?;
        doc.select(&csrf_selector)
            .next()
            .and_then(|n| n.value().attr("value"))
            .map(|s| s.to_string())
            .ok_or_else(|| "csrf token not found in dashboard".to_string())?
    };

    let authorized_id = {
        let id_selector = selector("#authorizedID")?;
        if let Some(value) = doc
            .select(&id_selector)
            .next()
            .and_then(|n| n.value().attr("value"))
            .map(|s| s.to_string())
        {
            value
        } else {
            let fallback_selector = selector("input[name='authorizedid']")?;
            doc.select(&fallback_selector)
                .next()
                .and_then(|n| n.value().attr("value"))
                .map(|s| s.to_string())
                .ok_or_else(|| "authorizedID not found in dashboard".to_string())?
        }
    };

    Ok((csrf, authorized_id))
}

pub fn classify_login_error(dashboard_html: &str) -> Option<String> {
    let lower = dashboard_html.to_lowercase();
    if lower.contains("invalid captcha") {
        return Some("Invalid captcha".to_string());
    }
    if lower.contains("invalid user name")
        || lower.contains("invalid login id")
        || lower.contains("invalid user id")
        || lower.contains("password")
    {
        return Some("Invalid username or password".to_string());
    }

    // Common fallback texts that VTOP may return across login templates.
    if lower.contains("authentication failed")
        || lower.contains("login failed")
        || lower.contains("unable to login")
        || lower.contains("incorrect")
    {
        return Some("Authentication failed. Please verify credentials and retry.".to_string());
    }

    // Try to parse human-readable error block text if present.
    let doc = Html::parse_document(dashboard_html);
    let candidate_selectors = [
        ".alert",
        ".alert-danger",
        "#error",
        ".error",
        ".text-danger",
        "div[role='alert']",
    ];

    for css in candidate_selectors {
        if let Ok(sel) = selector(css) {
            if let Some(node) = doc.select(&sel).next() {
                let text = node
                    .text()
                    .collect::<Vec<_>>()
                    .join(" ")
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" ");
                if !text.is_empty() {
                    return Some(text);
                }
            }
        }
    }

    None
}
