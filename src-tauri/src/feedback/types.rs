use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackStatus {
    #[serde(rename = "type")]
    pub feedback_type: String,
    #[serde(rename = "midSemester")]
    pub mid_semester: String,
    #[serde(rename = "teeSemester")]
    pub tee_semester: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FeedbackResponse {
    pub success: bool,
    pub data: Option<Vec<FeedbackStatus>>,
    pub error: Option<String>,
}
