use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AssessmentMark {
    pub sl_no: i32,
    pub mark_title: String,
    pub max_mark: f64,
    pub weightage_percent: f64,
    pub status: String,
    pub scored_mark: f64,
    pub weightage_mark: f64,
    pub class_average: String,
    pub remark: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentMarkEntry {
    pub sl_no: i32,
    pub class_number: String,
    pub course_code: String,
    pub course_title: String,
    pub course_type: String,
    pub course_system: String,
    pub faculty: String,
    pub slot: String,
    pub course_mode: String,
    pub assessments: Vec<AssessmentMark>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarksResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<StudentMarkEntry>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
