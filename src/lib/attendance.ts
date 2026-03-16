import { invoke } from "@tauri-apps/api/core";

export type Semester = {
  id: string;
  name: string;
};

export type AttendanceRecord = {
  slNo: number;
  classId: string;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  slot: string;
  faculty: {
    id: string;
    name: string;
    school: string;
  };
  attendanceType: string;
  registrationDate: string;
  attendanceDate: string;
  attendedClasses: number;
  totalClasses: number;
  attendancePercentage: number;
  status: string;
};

export type AttendanceDetailRecord = {
  serialNo: number;
  date: string;
  slot: string;
  dayAndTime: string;
  status: string;
};

type AttendanceResponse = {
  success: boolean;
  data?: AttendanceRecord[];
  semesterId?: string;
  error?: string;
};

type AttendanceDetailResponse = {
  success: boolean;
  data?: AttendanceDetailRecord[];
  error?: string;
};

type SemestersResponse = {
  success: boolean;
  semesters?: Semester[];
  error?: string;
};

export async function getSemesters(): Promise<SemestersResponse> {
  try {
    return await invoke<SemestersResponse>("attendance_get_semesters");
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getCurrentAttendance(): Promise<AttendanceResponse> {
  try {
    return await invoke<AttendanceResponse>("attendance_get_current");
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getAttendanceDetail(
  classId: string,
  slotName: string,
): Promise<AttendanceDetailResponse> {
  try {
    return await invoke<AttendanceDetailResponse>("attendance_get_detail", {
      classId,
      slotName,
    });
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
