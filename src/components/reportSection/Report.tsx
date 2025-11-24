import React from 'react';
import StudentsColumn from './columns/StudentsColumn';
import ReportDetailsColumn from './columns/ReportDetailsColumn';
import CoursesColumn from './columns/CoursesColumn';
import type { SortKey } from './types';

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
  courseName: string;
  courseCoefficient: number | null;
  note: string;
  noteNumeric: number | null;
  validateReport: boolean;
}

interface ReportProps {
  students: StudentCardItem[];
  reportDetails: ReportDetailItem[];
  courses: CoursePresenceRow[];
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  onSort: (key: SortKey) => void;
  onAddReport: (studentId: number) => void;
  onCreateReport: () => void;
  onViewDetails: (studentId: number, reportId: number | undefined, studentName: string) => void;
}

const Report: React.FC<ReportProps> = ({
  students,
  reportDetails,
  courses,
  sortConfig,
  onSort,
  onAddReport,
  onCreateReport,
  onViewDetails,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr_0.75fr] gap-6">
    <StudentsColumn students={students} onAddReport={onAddReport} onCreateReport={onCreateReport} />
    <ReportDetailsColumn items={reportDetails} onViewDetails={onViewDetails} />
    <CoursesColumn rows={courses} sortConfig={sortConfig} onSort={onSort} />
  </div>
);

export default Report;


