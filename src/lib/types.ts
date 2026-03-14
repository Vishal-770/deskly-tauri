export type CurriculumCategory = {
  code: string;
  name: string;
};

export type CurriculumCourse = {
  id: number;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  credits: number;
};

export type CurriculumResponse = {
  success: boolean;
  data?: {
    categories: CurriculumCategory[];
    courses: CurriculumCourse[];
  };
  error?: string;
};

export type AssessmentMark = {
  slNo: number;
  markTitle: string;
  maxMark: number;
  weightagePercent: number;
  status: string;
  scoredMark: number;
  weightageMark: number;
  classAverage: string;
  remark: string;
};

export type StudentMarkEntry = {
  slNo: number;
  classNumber: string;
  courseCode: string;
  courseTitle: string;
  courseType: string;
  courseSystem: string;
  faculty: string;
  slot: string;
  courseMode: string;
  assessments: AssessmentMark[];
};
