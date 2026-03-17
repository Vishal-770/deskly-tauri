use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimetableCourseCredits {
    pub lecture: f64,
    pub tutorial: f64,
    pub practical: f64,
    pub project: f64,
    pub total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimetableFaculty {
    pub name: String,
    pub school: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimetableCourse {
    pub sl_no: i32,
    pub class_group: String,
    pub code: String,
    pub title: String,
    pub course_type: String,
    pub credits: TimetableCourseCredits,
    pub category: String,
    pub registration_option: String,
    pub class_id: String,
    pub slot: String,
    pub venue: String,
    pub faculty: TimetableFaculty,
    pub registration_date: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleEntry {
    pub day: String,
    pub start_time: String,
    pub end_time: String,
    pub course_code: String,
    pub course_title: String,
    pub course_type: String,
    pub slot: String,
    pub venue: String,
    pub faculty: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct WeeklySchedule {
    pub monday: Vec<ScheduleEntry>,
    pub tuesday: Vec<ScheduleEntry>,
    pub wednesday: Vec<ScheduleEntry>,
    pub thursday: Vec<ScheduleEntry>,
    pub friday: Vec<ScheduleEntry>,
    pub saturday: Vec<ScheduleEntry>,
    pub sunday: Vec<ScheduleEntry>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimetableResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Vec<TimetableCourse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WeeklyScheduleResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<WeeklySchedule>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
