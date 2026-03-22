use super::types::{TimetableCourse, TimetableCourseCredits, TimetableFaculty};
use scraper::{Html, Selector};

fn text_of(el: &scraper::ElementRef) -> String {
    el.text()
        .collect::<Vec<_>>()
        .join(" ")
        .replace("\u{a0}", " ")
        .trim()
        .to_string()
}

fn parse_f64(s: &str) -> f64 {
    s.parse::<f64>().unwrap_or(0.0)
}

fn parse_i32(s: &str) -> i32 {
    s.parse::<i32>().unwrap_or(0)
}

pub fn parse_timetable_courses(html: &str) -> Result<Vec<TimetableCourse>, String> {
    let document = Html::parse_document(html);
    let table_selector = Selector::parse("#studentDetailsList table")
        .map_err(|_| "Invalid table selector".to_string())?;

    // Use only the first table (the Course List), matching Electron's .first()
    let table = match document.select(&table_selector).next() {
        Some(t) => t,
        None => return Ok(Vec::new()),
    };

    let row_selector = Selector::parse("tr").map_err(|_| "Invalid row selector".to_string())?;
    let td_selector = Selector::parse("td").map_err(|_| "Invalid td selector".to_string())?;

    let mut courses = Vec::new();
    for (_idx, row) in table.select(&row_selector).enumerate() {
        let cols: Vec<_> = row.select(&td_selector).collect();
        if cols.len() < 10 {
            continue;
        }

        // --- 1. Parse Course Info ---
        let course_raw = text_of(&cols[2]);
        let mut code = String::new();
        let mut title = String::new();
        let mut course_type = String::new();

        // Pattern matching like Electron: ^([A-Z0-9]+)\s*-\s*(.*?)\s*\(\s*(.*?)\s*\)$
        if let Some(dash_pos) = course_raw.find('-') {
            code = course_raw[..dash_pos].trim().to_string();
            let rest = course_raw[dash_pos + 1..].trim();
            if let Some(paren_start) = rest.rfind('(') {
                if rest.ends_with(')') {
                    title = rest[..paren_start].trim().to_string();
                    course_type = rest[paren_start + 1..rest.len() - 1].trim().to_string();
                } else {
                    title = rest.to_string();
                }
            } else {
                title = rest.to_string();
            }
        }

        // --- 2. Parse Credits ---
        let credit_raw = text_of(&cols[3]);
        let credit_parts: Vec<&str> = credit_raw.split_whitespace().collect();
        let credits = TimetableCourseCredits {
            lecture: credit_parts.get(0).map(|&s| parse_f64(s)).unwrap_or(0.0),
            tutorial: credit_parts.get(1).map(|&s| parse_f64(s)).unwrap_or(0.0),
            practical: credit_parts.get(2).map(|&s| parse_f64(s)).unwrap_or(0.0),
            project: credit_parts.get(3).map(|&s| parse_f64(s)).unwrap_or(0.0),
            total: credit_parts.get(4).map(|&s| parse_f64(s)).unwrap_or(0.0),
        };

        // --- 3. Parse Slot and Venue ---
        let slot_venue_raw = text_of(&cols[7]);
        let slot_parts: Vec<&str> = slot_venue_raw.split('-').collect();
        let slot = slot_parts
            .first()
            .map(|s| s.trim().to_string())
            .unwrap_or_default();
        let venue = if slot_parts.len() > 1 {
            slot_parts[1..].join("-").trim().to_string()
        } else {
            String::new()
        };

        // --- 4. Parse Faculty ---
        let faculty_raw = text_of(&cols[8]);
        let faculty_parts: Vec<&str> = faculty_raw.split('-').collect();
        let faculty_name = faculty_parts
            .first()
            .map(|s| s.trim().to_string())
            .unwrap_or_else(|| faculty_raw.clone());
        let faculty_school = if faculty_parts.len() > 1 {
            faculty_parts[1..].join("-").trim().to_string()
        } else {
            String::new()
        };

        courses.push(TimetableCourse {
            sl_no: parse_i32(&text_of(&cols[0])),
            class_group: text_of(&cols[1]),
            code,
            title,
            course_type,
            credits,
            category: text_of(&cols[4]),
            registration_option: text_of(&cols[5]),
            class_id: text_of(&cols[6]),
            slot: if slot.is_empty() {
                slot_venue_raw
            } else {
                slot
            },
            venue,
            faculty: TimetableFaculty {
                name: faculty_name,
                school: faculty_school,
            },
            registration_date: text_of(&cols[9]),
            status: text_of(&cols[11])
                .replace("Registered and Approved", "")
                .trim()
                .to_string(),
        });
    }

    Ok(courses)
}
