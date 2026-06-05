use scraper::{ElementRef, Html, Selector};

use super::types::{
    CalendarDay, CalendarMonthOption, ContactDetail, CurriculumCategory, CurriculumCourse,
    ExamScheduleEntry, HodDeanDetail, MonthlySchedule, Receipt,
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

pub fn parse_exam_schedule(html: &str) -> Result<Vec<ExamScheduleEntry>, String> {
    let document = Html::parse_document(html);
    let table_selector = Selector::parse("table.customTable").map_err(|_| "Invalid table selector".to_string())?;
    let tr_selector = Selector::parse("tr").map_err(|_| "Invalid row selector".to_string())?;
    let td_selector = Selector::parse("td").map_err(|_| "Invalid cell selector".to_string())?;

    let table = document
        .select(&table_selector)
        .next()
        .ok_or_else(|| "Could not find exam schedule table".to_string())?;

    let mut entries = Vec::new();
    let mut current_exam_type = "Unknown".to_string();

    for row in table.select(&tr_selector) {
        let cells: Vec<_> = row.select(&td_selector).collect();
        if cells.is_empty() {
            continue;
        }

        if cells.len() == 1 {
            let class_attr = cells[0].value().attr("class").unwrap_or("");
            if class_attr.contains("panelHead-secondary") {
                current_exam_type = text_of(&cells[0]);
                continue;
            }
        }

        if cells.len() == 13 {
            let serial_no = parse_i32(&text_of(&cells[0]));
            let course_code = text_of(&cells[1]);
            if serial_no == 0 && course_code.is_empty() {
                continue;
            }
            if course_code.contains("Course Code") {
                continue;
            }

            let course_title = text_of(&cells[2]);
            let course_type = text_of(&cells[3]);
            let class_id = text_of(&cells[4]);
            let slot = text_of(&cells[5]);
            let exam_date = text_of(&cells[6]);
            let exam_session = text_of(&cells[7]);
            let reporting_time = text_of(&cells[8]);
            let exam_time = text_of(&cells[9]);
            let venue = text_of(&cells[10]);
            let seat_location = text_of(&cells[11]);
            let seat_no = text_of(&cells[12]);

            entries.push(ExamScheduleEntry {
                exam_type: current_exam_type.clone(),
                serial_no,
                course_code,
                course_title,
                course_type,
                class_id,
                slot,
                exam_date,
                exam_session,
                reporting_time,
                exam_time,
                venue,
                seat_location,
                seat_no,
            });
        }
    }

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_exam_schedule() {
        let html = r#"
            <table class="customTable">
                <tr class="tableHeader">
                    <td>S.No.</td><td>Course Code</td><td>Course Title</td><td>Course Type</td>
                    <td>Class ID</td><td>Slot</td><td>Exam Date</td><td>Exam Session</td>
                    <td>Reporting Time</td><td>Exam Time</td><td>Venue</td><td>Seat Location</td><td>Seat No.</td>
                </tr>
                <tr class="tableContent">
                    <td class="panelHead-secondary" colspan="13" align="center">FAT</td>
                </tr>
                <tr class="tableContent">
                    <td>1</td>
                    <td>BCSE302L</td>
                    <td>Database Systems</td>
                    <td>TH</td>
                    <td>CH2025260501233</td>
                    <td>A1+TA1</td>
                    <td>20-Apr-2026</td>
                    <td>FN1</td>
                    <td>09:45 AM</td>
                    <td>10:00 AM - 01:00 PM</td>
                    <td><span>AB3-607</span></td>
                    <td><span><span>-</span></span></td>
                    <td><span>27</span></td>
                </tr>
                <tr class="tableContent">
                    <td class="panelHead-secondary" colspan="13" align="center">CAT2</td>
                </tr>
                <tr class="tableContent">
                    <td>1</td>
                    <td>BCSE302L</td>
                    <td>Database Systems</td>
                    <td>TH</td>
                    <td>CH2025260501233</td>
                    <td>A1+TA1</td>
                    <td>14-Mar-2026</td>
                    <td>FN2</td>
                    <td>11:45 AM</td>
                    <td>12:00 PM - 01:30 PM</td>
                    <td><span>AB3-106</span></td>
                    <td><span><span>R5C3</span></span></td>
                    <td><span>27</span></td>
                </tr>
            </table>
        "#;

        let entries = parse_exam_schedule(html).unwrap();
        assert_eq!(entries.len(), 2);
        
        assert_eq!(entries[0].exam_type, "FAT");
        assert_eq!(entries[0].course_code, "BCSE302L");
        assert_eq!(entries[0].course_title, "Database Systems");
        assert_eq!(entries[0].venue, "AB3-607");
        assert_eq!(entries[0].seat_location, "-");
        assert_eq!(entries[0].seat_no, "27");

        assert_eq!(entries[1].exam_type, "CAT2");
        assert_eq!(entries[1].venue, "AB3-106");
        assert_eq!(entries[1].seat_location, "R5C3");
        assert_eq!(entries[1].seat_no, "27");
    }

    #[test]
    fn test_parse_hod_dean_details() {
        let html = r#"
            <div class="box">
                <div class="box-header with-border text-center">
                    <h3 class="box-title"><b>DEAN</b></h3>
                </div>
                <table class="table">
                    <tr>
                        <td><b>Name of the Faculty </b></td>
                        <td>Dr. VISWANATHAN V</td>
                        <td rowspan="5"><img src="data:jpg;base64,12345" /></td>
                    </tr>
                    <tr>
                        <td><b>School </b></td>
                        <td>SCOPE</td>
                    </tr>
                    <tr>
                        <td><b>Cabin No </b></td>
                        <td>AB3-329</td>
                    </tr>
                    <tr>
                        <td><b>Email ID </b></td>
                        <td>dean.scope@vit.ac.in</td>
                    </tr>
                    <tr>
                        <td><b>Intercom </b></td>
                        <td>1234</td>
                    </tr>
                </table>
            </div>
        "#;

        let details = parse_hod_dean_details(html).unwrap();
        assert_eq!(details.len(), 1);
        assert_eq!(details[0].role, "DEAN");
        assert_eq!(details[0].name, "Dr. VISWANATHAN V");
        assert_eq!(details[0].school, "SCOPE");
        assert_eq!(details[0].cabin, "AB3-329");
        assert_eq!(details[0].email, "dean.scope@vit.ac.in");
        assert_eq!(details[0].intercom, "1234");
        assert_eq!(details[0].photo, "data:jpg;base64,12345");
    }
}

pub fn parse_hod_dean_details(html: &str) -> Result<Vec<HodDeanDetail>, String> {
    let document = Html::parse_document(html);
    let box_selector = Selector::parse(".box").map_err(|_| "Invalid box selector".to_string())?;
    let title_selector = Selector::parse(".box-title, h3").map_err(|_| "Invalid title selector".to_string())?;
    let table_selector = Selector::parse("table").map_err(|_| "Invalid table selector".to_string())?;
    let tr_selector = Selector::parse("tr").map_err(|_| "Invalid row selector".to_string())?;
    let td_selector = Selector::parse("td").map_err(|_| "Invalid cell selector".to_string())?;
    let img_selector = Selector::parse("img").map_err(|_| "Invalid img selector".to_string())?;

    let mut details = Vec::new();

    for box_el in document.select(&box_selector) {
        let role = box_el
            .select(&title_selector)
            .next()
            .map(|el| text_of(&el))
            .unwrap_or_else(|| "Unknown".to_string());

        if let Some(table) = box_el.select(&table_selector).next() {
            let mut name = String::new();
            let mut school = String::new();
            let mut cabin = String::new();
            let mut email = String::new();
            let mut intercom = String::new();
            let mut photo = String::new();

            for row in table.select(&tr_selector) {
                if let Some(img) = row.select(&img_selector).next() {
                    if let Some(src) = img.value().attr("src") {
                        photo = src.to_string();
                    }
                }

                let cells: Vec<_> = row.select(&td_selector).collect();
                if cells.len() >= 2 {
                    let key = text_of(&cells[0]).to_lowercase();
                    let val = text_of(&cells[1]);

                    if key.contains("name of the faculty") || key.contains("name of the dean") || key.contains("name of the hod") {
                        name = val;
                    } else if key.contains("school") || key.contains("department") {
                        school = val;
                    } else if key.contains("cabin") {
                        cabin = val;
                    } else if key.contains("email") {
                        email = val;
                    } else if key.contains("intercom") {
                        intercom = val;
                    }
                }
            }

            details.push(HodDeanDetail {
                role,
                name,
                school,
                cabin,
                email,
                intercom,
                photo,
            });
        }
    }

    Ok(details)
}
