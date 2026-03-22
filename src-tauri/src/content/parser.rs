use super::types::{CGPAData, CourseAttendance, SemesterAttendance};
use scraper::{Html, Selector};

pub fn extract_attendance_from_html(html: &str) -> Result<SemesterAttendance, String> {
    let document = Html::parse_document(html);

    let semester_selector = Selector::parse(".card-header span.bg-warning")
        .map_err(|_| "Invalid selector for semester".to_string())?;

    let semester = document
        .select(&semester_selector)
        .next()
        .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
        .unwrap_or_default();

    let row_selector =
        Selector::parse("table tbody tr").map_err(|_| "Invalid selector for rows".to_string())?;
    let cell_selector =
        Selector::parse("td").map_err(|_| "Invalid selector for cells".to_string())?;
    let fw_bold_selector =
        Selector::parse("span.fw-bold").map_err(|_| "Invalid selector for fw-bold".to_string())?;
    let span_selector =
        Selector::parse("span").map_err(|_| "Invalid selector for spans".to_string())?;

    let mut courses = Vec::new();
    let mut index = 1;

    for row in document.select(&row_selector) {
        let cells: Vec<_> = row.select(&cell_selector).collect();
        if cells.len() < 4 {
            continue;
        }

        // cells[0]: Course Code and Name
        let code = cells[0]
            .select(&fw_bold_selector)
            .next()
            .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
            .unwrap_or_default();

        // The last span contains the course name
        let name = cells[0]
            .select(&span_selector)
            .last()
            .map(|el| el.text().collect::<Vec<_>>().join("").trim().to_string())
            .unwrap_or_default();

        // cells[1]: Course Type
        let r#type = cells[1]
            .text()
            .collect::<Vec<_>>()
            .join("")
            .trim()
            .to_string();

        // cells[2]: Attendance
        let attendance_text = cells[2]
            .text()
            .collect::<Vec<_>>()
            .join("")
            .trim()
            .to_string();
        let attendance = attendance_text.parse::<f64>().unwrap_or(0.0);

        // cells[3]: Remark
        let remark = cells[3]
            .text()
            .collect::<Vec<_>>()
            .join("")
            .trim()
            .to_string();

        courses.push(CourseAttendance {
            index,
            code,
            name,
            r#type,
            attendance,
            remark,
        });

        index += 1;
    }

    Ok(SemesterAttendance { semester, courses })
}

pub fn extract_cgpa_from_html(html: &str) -> Result<CGPAData, String> {
    let document = Html::parse_document(html);

    let list_item_selector = Selector::parse(".list-group-item")
        .map_err(|_| "Invalid selector for list items".to_string())?;
    let span_selector =
        Selector::parse("span").map_err(|_| "Invalid selector for spans".to_string())?;

    let mut data = CGPAData {
        total_credits_required: 0.0,
        earned_credits: 0.0,
        current_cgpa: 0.0,
        non_graded_core: 0.0,
    };

    for item in document.select(&list_item_selector) {
        let spans: Vec<_> = item.select(&span_selector).collect();
        // Since scraper's select is recursive, it will collect the outer span and the inner span.
        // We need the direct children, or we can just filter out based on text.
        // Let's emulate Cheerios `find("span")` returning all descendent spans.
        // In the original JS:
        // const spans = $(item).find("span");
        // const label = $(spans[0]).text().trim();
        // const valueText = $(spans[1]).find("span").text().trim();
        // This relies on DOM tree order.

        if spans.len() >= 2 {
            let label = spans[0]
                .text()
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string();
            // In Cheerio `$(spans[1]).find("span").text()` extracts all text within spans inside the second span.
            // With scraper, spans[1].text() gets all text content of that element and descendants.
            let value_text = spans[1]
                .text()
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .to_string();
            let value = value_text.parse::<f64>().unwrap_or(0.0);

            if label.contains("Total Credits Required") {
                data.total_credits_required = value;
            } else if label.contains("Earned Credits") {
                data.earned_credits = value;
            } else if label.contains("Current CGPA") {
                data.current_cgpa = value;
            } else if label.contains("Non-graded Core Requirement") {
                data.non_graded_core = value;
            }
        }
    }

    Ok(data)
}
