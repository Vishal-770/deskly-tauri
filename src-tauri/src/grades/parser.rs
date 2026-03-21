use scraper::{Html, Selector};
use super::types::{
    CGPADetails, CourseGrade, CurriculumCategory, CurriculumProgress, CurriculumSummary,
    GradeDistribution, StudentHistoryData, StudentProfile,
};

fn clean_text(text: &str) -> String {
    text.replace(|c: char| c == '\n' || c == '\t', " ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

fn parse_f64(text: &str) -> f64 {
    clean_text(text).parse::<f64>().unwrap_or(0.0)
}

fn parse_i32(text: &str) -> i32 {
    clean_text(text).parse::<i32>().unwrap_or(0)
}

pub fn parse_student_history(html: &str) -> Result<StudentHistoryData, String> {
    let document = Html::parse_document(html);

    // 1. Parse Profile
    let mut profile = StudentProfile {
        reg_no: String::new(),
        name: String::new(),
        programme: String::new(),
        gender: String::new(),
        year_joined: String::new(),
        school: String::new(),
        campus: String::new(),
    };

    let profile_table_selector = Selector::parse("table").unwrap();
    for table in document.select(&profile_table_selector) {
        if table.inner_html().contains("Reg.No.") {
            let row_selector = Selector::parse(".tableContent").unwrap();
            if let Some(row) = table.select(&row_selector).next() {
                let td_selector = Selector::parse("td").unwrap();
                let cols: Vec<_> = row.select(&td_selector).collect();
                if cols.len() >= 10 {
                    profile.reg_no = clean_text(&cols[0].text().collect::<String>());
                    profile.name = clean_text(&cols[1].text().collect::<String>());
                    profile.programme = clean_text(&cols[2].text().collect::<String>());
                    profile.gender = clean_text(&cols[5].text().collect::<String>());
                    profile.year_joined = clean_text(&cols[6].text().collect::<String>());
                    profile.school = clean_text(&cols[8].text().collect::<String>());
                    profile.campus = clean_text(&cols[9].text().collect::<String>());
                }
            }
            break;
        }
    }

    // 2. Parse Effective Grades
    let mut grades = Vec::new();
    for table in document.select(&profile_table_selector) {
        if table.inner_html().contains("Effective Grades") {
            let row_selector = Selector::parse("tr.tableContent").unwrap();
            for row in table.select(&row_selector) {
                // Skip hidden rows or rows that don't look like data
                if let Some(id) = row.value().attr("id") {
                    if id.starts_with("detailsView_") {
                        continue;
                    }
                }

                let td_selector = Selector::parse("td").unwrap();
                let cols: Vec<_> = row.select(&td_selector).collect();
                if cols.len() >= 9 {
                    grades.push(CourseGrade {
                        sl_no: parse_i32(&cols[0].text().collect::<String>()),
                        course_code: clean_text(&cols[1].text().collect::<String>()),
                        course_title: clean_text(&cols[2].text().collect::<String>()),
                        course_type: clean_text(&cols[3].text().collect::<String>()),
                        credits: parse_f64(&cols[4].text().collect::<String>()),
                        grade: clean_text(&cols[5].text().collect::<String>()),
                        exam_month: clean_text(&cols[6].text().collect::<String>()),
                        result_declared: clean_text(&cols[7].text().collect::<String>()),
                        course_distribution: clean_text(&cols[8].text().collect::<String>()),
                    });
                }
            }
            break;
        }
    }

    // 3. Parse Curriculum
    let mut curriculum_details = Vec::new();
    let mut curriculum_summary = CurriculumSummary {
        total_required: 0.0,
        total_earned: 0.0,
    };

    for table in document.select(&profile_table_selector) {
        if table.inner_html().contains("Curriculum Distribution Type") {
            let row_selector = Selector::parse("tr.tableContent").unwrap();
            for row in table.select(&row_selector) {
                let td_selector = Selector::parse("td").unwrap();
                let cols: Vec<_> = row.select(&td_selector).collect();
                if cols.len() >= 3 {
                    let category = clean_text(&cols[0].text().collect::<String>());
                    let req = parse_f64(&cols[1].text().collect::<String>());
                    let earned = parse_f64(&cols[2].text().collect::<String>());

                    if category.is_empty() {
                        continue;
                    }

                    if category.to_lowercase().contains("total credits") {
                        curriculum_summary = CurriculumSummary {
                            total_required: req,
                            total_earned: earned,
                        };
                    } else {
                        let status = if earned >= req {
                            "Completed".to_string()
                        } else if earned > 0.0 {
                            "In Progress".to_string()
                        } else {
                            "Pending".to_string()
                        };

                        curriculum_details.push(CurriculumCategory {
                            category,
                            credits_required: req,
                            credits_earned: earned,
                            completion_status: status,
                        });
                    }
                }
            }
            break;
        }
    }

    // 4. Parse CGPA Details
    let mut cgpa_details = CGPADetails {
        credits_registered: 0.0,
        credits_earned: 0.0,
        cgpa: 0.0,
        grade_distribution: GradeDistribution {
            s: 0, a: 0, b: 0, c: 0, d: 0, e: 0, f: 0, n: 0,
        },
    };

    // Find table containing "Credits Registered"
    for table in document.select(&profile_table_selector) {
        if table.inner_html().contains("Credits Registered") {
            let row_selector = Selector::parse("tbody tr").unwrap();
            if let Some(row) = table.select(&row_selector).next() {
                let td_selector = Selector::parse("td").unwrap();
                let cols: Vec<_> = row.select(&td_selector).collect();
                if cols.len() >= 11 {
                    cgpa_details = CGPADetails {
                        credits_registered: parse_f64(&cols[0].text().collect::<String>()),
                        credits_earned: parse_f64(&cols[1].text().collect::<String>()),
                        cgpa: parse_f64(&cols[2].text().collect::<String>()),
                        grade_distribution: GradeDistribution {
                            s: parse_i32(&cols[3].text().collect::<String>()),
                            a: parse_i32(&cols[4].text().collect::<String>()),
                            b: parse_i32(&cols[5].text().collect::<String>()),
                            c: parse_i32(&cols[6].text().collect::<String>()),
                            d: parse_i32(&cols[7].text().collect::<String>()),
                            e: parse_i32(&cols[8].text().collect::<String>()),
                            f: parse_i32(&cols[9].text().collect::<String>()),
                            n: parse_i32(&cols[10].text().collect::<String>()),
                        },
                    };
                }
            }
            break;
        }
    }

    Ok(StudentHistoryData {
        profile,
        grades,
        curriculum: CurriculumProgress {
            details: curriculum_details,
            summary: curriculum_summary,
        },
        cgpa: cgpa_details,
    })
}
