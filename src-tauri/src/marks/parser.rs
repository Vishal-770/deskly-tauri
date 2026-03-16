use scraper::{ElementRef, Html, Selector};
use super::types::{AssessmentMark, StudentMarkEntry};

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

pub fn parse_marks(html: &str) -> Result<Vec<StudentMarkEntry>, String> {
    let document = Html::parse_document(html);
    let row_selector = Selector::parse(".customTable > tbody > tr.tableContent")
        .map_err(|_| "Invalid marks row selector".to_string())?;
    let nested_selector = Selector::parse(".customTable-level1 tr.tableContent-level1")
        .map_err(|_| "Invalid nested row selector".to_string())?;

    let mut courses: Vec<StudentMarkEntry> = Vec::new();
    let mut current_idx: Option<usize> = None;

    for row in document.select(&row_selector) {
        let cols: Vec<_> = row
            .children()
            .filter_map(ElementRef::wrap)
            .filter(|el| el.value().name() == "td")
            .collect();

        let is_details_row = cols.len() == 1
            || cols
                .first()
                .and_then(|c| c.value().attr("colspan"))
                .is_some();

        if !is_details_row && cols.len() >= 9 {
            let item = StudentMarkEntry {
                sl_no: parse_i32(&text_of(&cols[0])),
                class_number: text_of(&cols[1]),
                course_code: text_of(&cols[2]),
                course_title: text_of(&cols[3]),
                course_type: text_of(&cols[4]),
                course_system: text_of(&cols[5]),
                faculty: text_of(&cols[6]),
                slot: text_of(&cols[7]),
                course_mode: text_of(&cols[8]),
                assessments: Vec::new(),
            };
            courses.push(item);
            current_idx = Some(courses.len() - 1);
            continue;
        }

        if let Some(idx) = current_idx {
            for nested_row in row.select(&nested_selector) {
                let ncols: Vec<_> = nested_row
                    .children()
                    .filter_map(ElementRef::wrap)
                    .filter(|el| el.value().name() == "td")
                    .collect();
                if ncols.len() < 10 {
                    continue;
                }

                courses[idx].assessments.push(AssessmentMark {
                    sl_no: parse_i32(&text_of(&ncols[0])),
                    mark_title: text_of(&ncols[1]),
                    max_mark: parse_f64(&text_of(&ncols[2])),
                    weightage_percent: parse_f64(&text_of(&ncols[3])),
                    status: text_of(&ncols[4]),
                    scored_mark: parse_f64(&text_of(&ncols[5])),
                    weightage_mark: parse_f64(&text_of(&ncols[6])),
                    class_average: text_of(&ncols[7]),
                    remark: text_of(&ncols[9]),
                });
            }
        }
    }

    Ok(courses)
}
