import React from 'react';
import StudentsColumn from './columns/StudentsColumn';
import ReportDetailsColumn from './columns/ReportDetailsColumn';

export interface AvatarInfo {
  type: 'image' | 'initials';
  value: string;
}

export interface StudentCardItem {
  studentId: number;
  name: string;
  avatar: AvatarInfo;
  hasReport: boolean;
}

export interface ReportDetailItem {
  studentId: number;
  detailId?: number;
  studentName: string;
  mention?: string | null;
  remarks?: string | null;
  status?: number | null;
  passed?: boolean | null;
  updatedAt?: string | null;
  reportId?: number;
  courseName?: string | null;
  teacherName?: string | null;
  note?: number | string | null;
  hasDetails?: boolean;
}

export interface CoursePresenceRow {
  id: number;
  studentId: number;
  studentName: string;
  avatar: AvatarInfo;
  teacherName: string;
  teacherId?: number | null;
  courseName: string;
  courseId?: number | null;
  courseCoefficient: number | null;
  note: string;
  noteNumeric: number | null;
  validateReport: boolean;
}

interface ReportProps {
  students: StudentCardItem[];
  reportDetails: ReportDetailItem[];
  onAddReport: (studentId: number) => void;
  onCreateReport: () => void;
  onViewDetails: (studentId: number, reportId: number | undefined, detailId?: number) => void;
  onCreateDetailFromStudent: (studentId: number) => void;
  onExportStudentReport: (studentId: number) => void;
  onShowAllCourses: () => void;
  hasCourseData: boolean;
  isCreateReportLoading?: boolean;
  disableCreateReport?: boolean;
  creatingDetailStudentId?: number | null;
  selectedStudentId?: number | null;
  selectedStudentName?: string | null;
  selectedStudentHasCourses?: boolean;
  onShowSelectedStudentCourses?: () => void;
}

const Report: React.FC<ReportProps> = ({
  students,
  reportDetails,
  onAddReport,
  onCreateReport,
  onViewDetails,
  onCreateDetailFromStudent,
  onExportStudentReport,
  onShowAllCourses,
  hasCourseData,
  isCreateReportLoading = false,
  disableCreateReport = false,
  creatingDetailStudentId = null,
  selectedStudentId = null,
  selectedStudentName = null,
  selectedStudentHasCourses = false,
  onShowSelectedStudentCourses,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.4fr] gap-6">
    <StudentsColumn
      students={students}
      onAddReport={onAddReport}
      onCreateReport={onCreateReport}
      onCreateDetail={onCreateDetailFromStudent}
      onExportReport={onExportStudentReport}
      isCreateReportLoading={isCreateReportLoading}
      disableCreateReport={disableCreateReport}
      creatingDetailStudentId={creatingDetailStudentId}
      selectedStudentId={selectedStudentId}
    />
    <ReportDetailsColumn
      items={reportDetails}
      onViewDetails={onViewDetails}
      onShowAllCourses={onShowAllCourses}
      hasCourseData={hasCourseData}
      selectedStudentName={selectedStudentName}
      selectedStudentHasCourses={selectedStudentHasCourses}
      onShowSelectedStudentCourses={onShowSelectedStudentCourses}
    />
  </div>
);

export default Report;


