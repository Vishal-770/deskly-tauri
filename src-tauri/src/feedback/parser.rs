use scraper::{Html, Selector};
use crate::feedback::types::FeedbackStatus;

pub fn parse_feedback_status(html: &str) -> Result<Vec<FeedbackStatus>, String> {
    let document = Html::parse_document(html);
    let row_selector = Selector::parse("#loadMyFragment table tbody tr")
        .map_err(|_| "Failed to parse row selector")?;
    let cell_selector = Selector::parse("td")
        .map_err(|_| "Failed to parse cell selector")?;

    let mut feedback_data = Vec::new();

    for row in document.select(&row_selector) {
        let cells: Vec<_> = row.select(&cell_selector).collect();
        if cells.len() >= 3 {
            let feedback_type = cells[0].text().collect::<String>().trim().to_string();
            let mid_semester = cells[1].text().collect::<String>().trim().to_string();
            let tee_semester = cells[2].text().collect::<String>().trim().to_string();

            feedback_data.push(FeedbackStatus {
                feedback_type,
                mid_semester,
                tee_semester,
            });
        }
    }

    Ok(feedback_data)
}
