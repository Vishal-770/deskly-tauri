use scraper::{Html, Selector};

use super::types::{AttendanceDetailRecord, AttendanceRecord, Faculty, Semester};

fn clean_text(raw: &str) -> String {
    raw.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn cell_text(cells: &[scraper::ElementRef<'_>], index: usize) -> String {
    cells
        .get(index)
        .map(|c| clean_text(&c.text().collect::<String>()))
        .unwrap_or_default()
}

fn parse_i32(value: &str) -> i32 {
    value.trim().parse::<i32>().unwrap_or(0)
}

fn parse_f64(value: &str) -> f64 {
    value.trim().parse::<f64>().unwrap_or(0.0)
}

fn extract_class_id(raw_html: &str) -> String {
    let needle = "processViewAttendanceDetail('";
    if let Some(start) = raw_html.find(needle) {
        let rest = &raw_html[start + needle.len()..];
        if let Some(end) = rest.find('\'') {
            return rest[..end].to_string();
        }
    }
    String::new()
}

pub fn extract_semesters_from_html(html: &str) -> Result<Vec<Semester>, String> {
    let document = Html::parse_document(html);
    let option_selector = Selector::parse("select#semesterSubId option")
        .map_err(|_| "Invalid selector for semester options".to_string())?;

    let mut semesters = Vec::new();
    for option in document.select(&option_selector) {
        let id = option
            .value()
            .attr("value")
            .unwrap_or("")
            .trim()
            .to_string();
        let name = clean_text(&option.text().collect::<String>());
        if !id.is_empty() {
            semesters.push(Semester { id, name });
        }
    }

    if semesters.is_empty() {
        return Err("No semester options found in VTOP response".to_string());
    }

    Ok(semesters)
}

pub fn parse_attendance(html: &str) -> Result<Vec<AttendanceRecord>, String> {
    let document = Html::parse_document(html);
    let row_selector = Selector::parse("#getStudentDetails table tr")
        .map_err(|_| "Invalid selector for attendance rows".to_string())?;
    let cell_selector =
        Selector::parse("td").map_err(|_| "Invalid selector for attendance cells".to_string())?;
    let p_selector =
        Selector::parse("p").map_err(|_| "Invalid selector for faculty paragraphs".to_string())?;

    let mut records = Vec::new();
    for row in document.select(&row_selector) {
        let cells: Vec<_> = row.select(&cell_selector).collect();
        if cells.len() < 14 {
            continue;
        }

        let faculty_ps: Vec<_> = cells[5].select(&p_selector).collect();
        let faculty = Faculty {
            id: faculty_ps
                .first()
                .map(|x| clean_text(&x.text().collect::<String>()))
                .unwrap_or_default(),
            name: faculty_ps
                .get(1)
                .map(|x| clean_text(&x.text().collect::<String>()))
                .unwrap_or_default(),
            school: faculty_ps
                .get(2)
                .map(|x| clean_text(&x.text().collect::<String>()))
                .unwrap_or_default(),
        };

        let view_html = cells[13].inner_html();
        let class_id = extract_class_id(&view_html);

        records.push(AttendanceRecord {
            sl_no: parse_i32(&cell_text(&cells, 0)),
            course_code: cell_text(&cells, 1),
            course_title: cell_text(&cells, 2),
            course_type: cell_text(&cells, 3),
            slot: cell_text(&cells, 4),
            faculty,
            attendance_type: cell_text(&cells, 6),
            registration_date: cell_text(&cells, 7),
            attendance_date: cell_text(&cells, 8),
            attended_classes: parse_i32(&cell_text(&cells, 9)),
            total_classes: parse_i32(&cell_text(&cells, 10)),
            attendance_percentage: parse_f64(&cell_text(&cells, 11)),
            status: cell_text(&cells, 12),
            class_id,
        });
    }

    Ok(records)
}

pub fn parse_attendance_details(html: &str) -> Result<Vec<AttendanceDetailRecord>, String> {
    let document = Html::parse_document(html);
    let row_selector = Selector::parse("table tr")
        .map_err(|_| "Invalid selector for attendance detail rows".to_string())?;
    let cell_selector = Selector::parse("td")
        .map_err(|_| "Invalid selector for attendance detail cells".to_string())?;

    let mut rows = document.select(&row_selector);
    let _ = rows.next(); // Skip header row.

    let mut records = Vec::new();
    for row in rows {
        let cells: Vec<_> = row.select(&cell_selector).collect();
        if cells.len() < 5 {
            continue;
        }

        records.push(AttendanceDetailRecord {
            serial_no: parse_i32(&cell_text(&cells, 0)),
            date: cell_text(&cells, 1),
            slot: cell_text(&cells, 2),
            day_and_time: cell_text(&cells, 3),
            status: cell_text(&cells, 4),
        });
    }

    Ok(records)
}
