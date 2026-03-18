use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentDetails {
    pub name: String,
    pub register_number: String,
    pub application_number: String,
    pub program: String,
    pub dob: String,
    pub gender: String,
    pub mobile: String,
    pub vit_email: String,
    pub personal_email: String,
    pub photo_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProctorDetails {
    pub faculty_id: String,
    pub name: String,
    pub designation: String,
    pub school: String,
    pub cabin: String,
    pub mobile: String,
    pub email: String,
    pub photo_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HostelDetails {
    pub block_name: String,
    pub room_number: String,
    pub bed_type: String,
    pub mess_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileData {
    pub student: StudentDetails,
    pub proctor: ProctorDetails,
    pub hostel: HostelDetails,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfileResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<ProfileData>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
