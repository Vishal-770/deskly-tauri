use scraper::{Html, Selector};
use super::types::{ProfileData, StudentDetails, ProctorDetails, HostelDetails};

fn text_of(el: &scraper::ElementRef) -> String {
    el.text().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ").replace("\n", " ").replace("\r", " ").replace("\t", " ").trim().to_string()
}

fn get_table_value(document: &Html, context_selector: &str, label: &str) -> String {
    let selector_str = format!("{} tr", context_selector);
    let row_selector = Selector::parse(&selector_str).unwrap();
    let td_selector = Selector::parse("td").unwrap();

    for row in document.select(&row_selector) {
        let cols: Vec<_> = row.select(&td_selector).collect();
        for i in 0..cols.len() {
            let text = text_of(&cols[i]);
            if text.to_uppercase().contains(&label.to_uppercase()) {
                if i + 1 < cols.len() {
                    return text_of(&cols[i + 1]);
                }
            }
        }
    }
    String::new()
}

fn get_label_value(document: &Html, label_text: &str) -> String {
    let label_selector = Selector::parse("label").unwrap();
    for label in document.select(&label_selector) {
        let text = text_of(&label);
        if text.to_uppercase().contains(&label_text.to_uppercase()) {
            // Find next label
            let mut next = label.next_sibling();
            while let Some(node) = next {
                if let Some(el) = scraper::ElementRef::wrap(node) {
                    if el.value().name() == "label" {
                        return text_of(&el);
                    }
                }
                next = node.next_sibling();
            }
        }
    }
    String::new()
}

pub fn parse_student_profile(html: &str) -> Result<ProfileData, String> {
    let document = Html::parse_document(html);

    // --- 1. Student Details ---
    let name_selector = Selector::parse(".card .col-4 p").map_err(|_| "Invalid name selector".to_string())?;
    let img_selector = Selector::parse(".card .col-4 img").map_err(|_| "Invalid image selector".to_string())?;
    let regno_selector = Selector::parse("#regno").map_err(|_| "Invalid regno selector".to_string())?;
    let applno_selector = Selector::parse("#applno").map_err(|_| "Invalid applno selector".to_string())?;

    let name = document.select(&name_selector).next().map(|el| text_of(&el)).unwrap_or_default();
    let photo_url = document.select(&img_selector).next().and_then(|el| el.value().attr("src")).unwrap_or_default().to_string();

    let register_number = document.select(&regno_selector).next().and_then(|el| el.value().attr("value")).map(|v| v.to_string())
        .unwrap_or_else(|| get_table_value(&document, "#collapseOne", "REGISTER NUMBER"));
    
    let application_number = document.select(&applno_selector).next().and_then(|el| el.value().attr("value")).map(|v| v.to_string())
        .unwrap_or_else(|| get_table_value(&document, "#collapseOne", "APPLICATION NUMBER"));

    let program = get_label_value(&document, "PROGRAM & BRANCH");
    let dob = get_table_value(&document, "#collapseOne", "DATE OF BIRTH");
    let gender = get_table_value(&document, "#collapseOne", "GENDER");
    let mobile = get_table_value(&document, "#collapseOne", "MOBILE NUMBER");
    let vit_email = get_label_value(&document, "VIT EMAIL");
    let personal_email = get_table_value(&document, "#collapseOne", "EMAIL");

    let student = StudentDetails {
        name,
        register_number,
        application_number,
        program,
        dob,
        gender,
        mobile,
        vit_email,
        personal_email,
        photo_url,
    };

    // --- 2. Proctor Details ---
    let proctor_img_selector = Selector::parse("#collapseFour table img").map_err(|_| "Invalid proctor image selector".to_string())?;
    let proctor_photo_url = document.select(&proctor_img_selector).next().and_then(|el| el.value().attr("src")).unwrap_or_default().to_string();

    let proctor = ProctorDetails {
        faculty_id: get_table_value(&document, "#collapseFour", "FACULTY ID"),
        name: get_table_value(&document, "#collapseFour", "FACULTY NAME"),
        designation: get_table_value(&document, "#collapseFour", "DESIGNATION"),
        school: get_table_value(&document, "#collapseFour", "SCHOOL"),
        cabin: get_table_value(&document, "#collapseFour", "CABIN"),
        mobile: get_table_value(&document, "#collapseFour", "MOBILE"),
        email: get_table_value(&document, "#collapseFour", "EMAIL"),
        photo_url: proctor_photo_url,
    };

    // --- 3. Hostel Details ---
    let hostel = HostelDetails {
        block_name: get_table_value(&document, "#collapseFive", "Block Name"),
        room_number: get_table_value(&document, "#collapseFive", "Room No"),
        bed_type: get_table_value(&document, "#collapseFive", "Bed Type"),
        mess_type: get_table_value(&document, "#collapseFive", "Mess Information"),
    };

    Ok(ProfileData {
        student,
        proctor,
        hostel,
    })
}
