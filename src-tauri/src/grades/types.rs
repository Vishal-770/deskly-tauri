use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentProfile {
    pub reg_no: String,
    pub name: String,
    pub programme: String,
    pub gender: String,
    pub year_joined: String,
    pub school: String,
    pub campus: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CourseGrade {
    pub sl_no: i32,
    pub course_code: String,
    pub course_title: String,
    pub course_type: String,
    pub credits: f64,
    pub grade: String,
    pub exam_month: String,
    pub result_declared: String,
    pub course_distribution: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurriculumCategory {
    pub category: String,
    pub credits_required: f64,
    pub credits_earned: f64,
    pub completion_status: String, // "Completed" | "In Progress" | "Pending"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurriculumSummary {
    pub total_required: f64,
    pub total_earned: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CurriculumProgress {
    pub details: Vec<CurriculumCategory>,
    pub summary: CurriculumSummary,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GradeDistribution {
    pub s: i32,
    pub a: i32,
    pub b: i32,
    pub c: i32,
    pub d: i32,
    pub e: i32,
    pub f: i32,
    pub n: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CGPADetails {
    pub credits_registered: f64,
    pub credits_earned: f64,
    pub cgpa: f64,
    pub grade_distribution: GradeDistribution,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentHistoryData {
    pub profile: StudentProfile,
    pub grades: Vec<CourseGrade>,
    pub curriculum: CurriculumProgress,
    pub cgpa: CGPADetails,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GradesResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<StudentHistoryData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
