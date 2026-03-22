use scraper::{ElementRef, Html, Selector};

use super::types::{
    CalendarDay, CalendarMonthOption, ContactDetail, CurriculumCategory, CurriculumCourse,
    MonthlySchedule, Receipt,
};

fn clean_text(raw: &str) -> String {
    raw.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn text_of(element: &ElementRef<'_>) -> String {
    clean_text(&element.text().collect::<String>())
}

fn parse_i32(value: &str) -> i32 {
    value.trim().parse::<i32>().unwrap_or(0)
}

fn parse_f64(value: &str) -> f64 {
    value.trim().parse::<f64>().unwrap_or(0.0)
}

pub fn parse_calendar_options(html: &str) -> Result<Vec<CalendarMonthOption>, String> {
    let document = Html::parse_document(html);
    let a_selector = Selector::parse("a").map_err(|_| "Invalid link selector".to_string())?;

    let mut options = Vec::new();
    for a in document.select(&a_selector) {
        let onclick = a.value().attr("onclick").unwrap_or("");
        if onclick.contains("processViewCalendar") {
            let label = text_of(&a);

            // Extract '01-DEC-2025' from javascript:processViewCalendar('01-DEC-2025');
            let date_value = if let Some(start) = onclick.find('\'') {
                let rest = &onclick[start + 1..];
                if let Some(end) = rest.find('\'') {
                    rest[..end].to_string()
                } else {
                    "".to_string()
                }
            } else {
                "".to_string()
            };

            if !label.is_empty() && !date_value.is_empty() {
                options.push(CalendarMonthOption { label, date_value });
            }
        }
    }

    Ok(options)
}

pub fn parse_calendar_view(html: &str) -> Result<MonthlySchedule, String> {
    let document = Html::parse_document(html);

    let month_selector = Selector::parse("h4").map_err(|_| "Invalid month selector".to_string())?;
    let cell_selector = Selector::parse("table.calendar-table tr td")
        .map_err(|_| "Invalid calendar cell selector".to_string())?;
    let span_selector = Selector::parse("span").map_err(|_| "Invalid span selector".to_string())?;

    let month = document
        .select(&month_selector)
        .next()
        .map(|el| text_of(&el))
        .unwrap_or_default();

    let mut days = Vec::new();
    for cell in document.select(&cell_selector) {
        let spans: Vec<_> = cell.select(&span_selector).collect();
        if spans.is_empty() {
            continue;
        }

        let date_text = text_of(&spans[0]);
        if date_text.is_empty() {
            continue;
        }

        let mut content = Vec::new();
        for span in spans.iter().skip(1) {
            let txt = text_of(span);
            if !txt.is_empty() {
                content.push(txt);
            }
        }

        days.push(CalendarDay {
            date: parse_i32(&date_text),
            content,
        });
    }

    Ok(MonthlySchedule { month, days })
}

pub fn parse_contact_details(html: &str) -> Result<Vec<ContactDetail>, String> {
    let document = Html::parse_document(html);
    let card_selector = Selector::parse(".col .card.rounded-3")
        .map_err(|_| "Invalid contact card selector".to_string())?;
    let header_selector = Selector::parse(".card-header strong")
        .map_err(|_| "Invalid contact header selector".to_string())?;
    let p_selector = Selector::parse(".card-body p")
        .map_err(|_| "Invalid contact paragraph selector".to_string())?;
    let email_selector = Selector::parse(".card-body p.text-success")
        .map_err(|_| "Invalid contact email selector".to_string())?;

    let mut contacts = Vec::new();
    for card in document.select(&card_selector) {
        let department = card
            .select(&header_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_default();
        let description = card
            .select(&p_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_default();
        let email = card
            .select(&email_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_default();

        if !department.is_empty() || !email.is_empty() {
            contacts.push(ContactDetail {
                department,
                description,
                email,
            });
        }
    }

    Ok(contacts)
}

pub fn parse_receipts(html: &str) -> Result<Vec<Receipt>, String> {
    let document = Html::parse_document(html);
    let table_selector =
        Selector::parse("table").map_err(|_| "Invalid table selector".to_string())?;
    let row_selector = Selector::parse("tr").map_err(|_| "Invalid row selector".to_string())?;
    let td_selector = Selector::parse("td").map_err(|_| "Invalid td selector".to_string())?;
    let input_selector =
        Selector::parse("input").map_err(|_| "Invalid input selector".to_string())?;
    let button_selector =
        Selector::parse("button").map_err(|_| "Invalid button selector".to_string())?;

    let mut receipts = Vec::new();

    for table in document.select(&table_selector) {
        if !table.text().collect::<String>().contains("RECEIPT NUMBER") {
            continue;
        }

        for row in table.select(&row_selector) {
            let cols: Vec<_> = row.select(&td_selector).collect();
            if cols.len() < 5 {
                continue;
            }

            let receipt_number = text_of(&cols[0]);
            let date = text_of(&cols[1]);
            let amount = parse_f64(&text_of(&cols[2]));
            let campus_code = text_of(&cols[3]);
            if receipt_number.is_empty() {
                continue;
            }

            let mut appl_no = String::new();
            let mut reg_no = String::new();
            for input in cols[4].select(&input_selector) {
                if let Some(name) = input.value().attr("name") {
                    let value = input.value().attr("value").unwrap_or("").to_string();
                    if name == "applno" {
                        appl_no = value.clone();
                    }
                    if name == "regno" {
                        reg_no = value;
                    }
                }
            }

            let mut receipt_id = String::new();
            if let Some(button) = cols[4].select(&button_selector).next() {
                if let Some(onclick) = button.value().attr("onclick") {
                    let needle = "doDuplicateReceipt('";
                    if let Some(start) = onclick.find(needle) {
                        let rest = &onclick[start + needle.len()..];
                        if let Some(end) = rest.find('\'') {
                            receipt_id = rest[..end].to_string();
                        }
                    }
                }
            }

            receipts.push(Receipt {
                receipt_number,
                date,
                amount,
                campus_code,
                receipt_id,
                appl_no,
                reg_no,
            });
        }
    }

    Ok(receipts)
}

pub fn parse_curriculum_categories(html: &str) -> Result<Vec<CurriculumCategory>, String> {
    let document = Html::parse_document(html);
    let card_selector = Selector::parse(".categoty-card")
        .map_err(|_| "Invalid curriculum card selector".to_string())?;
    let code_selector = Selector::parse(".symbol-label > div")
        .map_err(|_| "Invalid curriculum code selector".to_string())?;
    let name_selector = Selector::parse(".col-6 span")
        .map_err(|_| "Invalid curriculum name selector".to_string())?;

    let mut categories = Vec::new();
    for card in document.select(&card_selector) {
        let code = card
            .select(&code_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_default();
        if code.is_empty() {
            continue;
        }

        let name = card
            .select(&name_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_default();

        let body_text = text_of(&card);
        let mut credits = 0;
        let mut max_credits = 0;

        if let Some(idx) = body_text.find("Credit:") {
            let slice = &body_text[idx + 7..];
            credits = slice
                .split_whitespace()
                .next()
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(0);
        }
        if let Some(idx) = body_text.find("Max. Credit:") {
            let slice = &body_text[idx + 12..];
            max_credits = slice
                .split_whitespace()
                .next()
                .and_then(|v| v.parse::<i32>().ok())
                .unwrap_or(0);
        }

        categories.push(CurriculumCategory {
            code,
            name,
            credits,
            max_credits,
        });
    }

    Ok(categories)
}

pub fn parse_curriculum_courses(html: &str) -> Result<Vec<CurriculumCourse>, String> {
    let document = Html::parse_document(html);
    let row_selector = Selector::parse("table.example tbody tr")
        .map_err(|_| "Invalid curriculum course row selector".to_string())?;
    let td_selector = Selector::parse("td").map_err(|_| "Invalid td selector".to_string())?;
    let span_selector = Selector::parse("span").map_err(|_| "Invalid span selector".to_string())?;

    let mut rows = Vec::new();
    for row in document.select(&row_selector) {
        let cols: Vec<_> = row.select(&td_selector).collect();
        if cols.len() < 5 {
            continue;
        }

        let code = cols[1]
            .select(&span_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_else(|| text_of(&cols[1]));

        rows.push(CurriculumCourse {
            serial_no: parse_i32(&text_of(&cols[0])),
            code,
            title: text_of(&cols[2]),
            course_type: text_of(&cols[3]),
            credits: parse_f64(&text_of(&cols[4])),
        });
    }

    Ok(rows)
}
