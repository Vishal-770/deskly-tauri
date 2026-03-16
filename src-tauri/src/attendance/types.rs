use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Semester {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Faculty {
    pub id: String,
    pub name: String,
    pub school: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceRecord {
    pub sl_no: i32,
    pub class_id: String,
    pub course_code: String,
    pub course_title: String,
    pub course_type: String,
    pub slot: String,
    pub faculty: Faculty,
    pub attendance_type: String,
    pub registration_date: String,
    pub attendance_date: String,
    pub attended_classes: i32,
    pub total_classes: i32,
    pub attendance_percentage: f64,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceDetailRecord {
    pub serial_no: i32,
    pub date: String,
    pub slot: String,
    pub day_and_time: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<AttendanceRecord>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semester_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttendanceDetailResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<AttendanceDetailRecord>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SemestersResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub semesters: Option<Vec<Semester>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
