use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] // Match TS casing
pub struct CourseAttendance {
    pub index: usize,
    pub code: String,
    pub name: String,
    pub r#type: String, // 'type' is a reserved keyword in Rust
    pub attendance: f64,
    pub remark: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SemesterAttendance {
    pub semester: String,
    pub courses: Vec<CourseAttendance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CGPAData {
    pub total_credits_required: f64,
    pub earned_credits: f64,
    pub current_cgpa: f64,
    pub non_graded_core: f64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub courses: Option<Vec<CourseAttendance>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semester: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CGPAResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cgpa_data: Option<CGPAData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
