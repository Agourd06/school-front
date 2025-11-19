import React from 'react';
import type { ClassStudentAssignment } from '../../../api/classStudent';
import BaseModal from '../../modals/BaseModal';
import { getFileUrl } from '../../../utils/apiConfig';

interface ClassStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: ClassStudentAssignment[];
  isLoading: boolean;
  error: string | null;
  classTitle?: string;
}

const formatStudentName = (assignment: ClassStudentAssignment) => {
  const student = assignment.student;
  if (!student) return `Student #${assignment.student_id}`;
  const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim();
  if (fullName) return fullName;
  if (student.email) return student.email;
  return `Student #${student.id}`;
};

const ClassStudentsModal: React.FC<ClassStudentsModalProps> = ({
  isOpen,
  onClose,
  students,
  isLoading,
  error,
  classTitle,
}) => {
  const totalStudents = students.length;

  const getAvatarDetails = (assignment: ClassStudentAssignment) => {
    const picture = assignment.student?.picture;
    if (picture) {
      return { type: 'image' as const, value: getFileUrl(picture) };
    }
    const first = assignment.student?.first_name ?? '';
    const last = assignment.student?.last_name ?? '';
    const initials = `${first.slice(0, 1)}${last.slice(0, 1)}`.trim().toUpperCase() || '??';
    return { type: 'initials' as const, value: initials };
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="space-y-1">
          <p className="text-lg font-semibold text-gray-900">Class students</p>
          {classTitle && <p className="text-sm text-gray-500">{classTitle}</p>}
        </div>
      }
      className="sm:max-w-4xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-blue-700">
          <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
            <path d="M22 12c0-5.523-4.477-10-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="origin-center" />
          </svg>
          <span className="ml-3 font-medium">Loading students…</span>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">Failed to load students: {error}</div>
      ) : !students.length ? (
        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">No students are assigned to this class yet.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">Students</p>
              <p className="text-xs text-gray-500">{totalStudents} student{totalStudents === 1 ? '' : 's'} enrolled</p>
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 shadow-inner p-3">
            <div className="max-h-[32rem] overflow-y-auto pr-1">
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {students.map((assignment) => {
                  const avatar = getAvatarDetails(assignment);
                  const student = assignment.student;
                  return (
                    <li
                      key={assignment.id}
                      className="flex items-center gap-3 rounded-2xl border border-blue-50 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 shadow-sm"
                    >
                      {avatar.type === 'image' ? (
                        <img
                          src={avatar.value}
                          alt={formatStudentName(assignment)}
                          className="h-12 w-12 rounded-full object-cover border border-white shadow"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {avatar.value}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold leading-tight truncate">{formatStudentName(assignment)}</p>
                        {student?.email && <p className="text-xs text-blue-500 truncate">{student.email}</p>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </BaseModal>
  );
};

export default ClassStudentsModal;


