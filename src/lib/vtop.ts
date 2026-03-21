import { invoke } from "@tauri-apps/api/core";

export interface CourseAttendance {
  index: number;
  code: string;
  name: string;
  type: string;
  attendance: number;
  remark: string;
}

export interface SemesterAttendance {
  semester: string;
  courses: CourseAttendance[];
}

export interface CGPAData {
  totalCreditsRequired: number;
  earnedCredits: number;
  currentCgpa: number;
  nonGradedCore: number;
}

export interface ContentResponse {
  success: boolean;
  courses?: CourseAttendance[];
  semester?: string;
  error?: string;
}

export interface CGPAResponse {
  success: boolean;
  cgpaData?: CGPAData;
  error?: string;
}

export async function getContentPage(): Promise<ContentResponse> {
  try {
    return await invoke<ContentResponse>("get_content_page");
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getCGPAPage(): Promise<CGPAResponse> {
  try {
    return await invoke<CGPAResponse>("get_cgpa_page");
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
