import React from 'react';
import BaseModal from './BaseModal';
import { useClassStudents } from '../../hooks/useClassStudents';
import { getFileUrl } from '../../utils/apiConfig';
import type { ClassStudentAssignment } from '../../api/classStudent';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type:
    | 'program'
    | 'specialization'
    | 'course'
    | 'module'
    | 'student link type'
    | 'student diplome'
    | 'student contact'
    | 'level'
    | 'class'
    | 'class assignment'
    | 'class course';
  classId?: number; // Optional class ID to fetch students when type is 'class'
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type,
  classId,
}) => {
  // Fetch students if this is a class details modal and classId is provided
  const { data: classStudentsData, isLoading: loadingStudents } = useClassStudents({
    class_id: classId,
    status: 1, // Only active students
  });

  const students = classStudentsData?.data || [];
  const showStudents = type === 'class' && classId !== undefined;

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

  const getStudentName = (assignment: ClassStudentAssignment) => {
    const first = assignment.student?.first_name ?? '';
    const last = assignment.student?.last_name ?? '';
    const full = `${first} ${last}`.trim();
    if (full) return full;
    return assignment.student?.email ?? `Student #${assignment.student_id}`;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Details${title ? `: ${title}` : ''}`}
      className="sm:max-w-3xl"
    >
      <div className="space-y-6">
        <div>
          {!!title && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {type.charAt(0).toUpperCase() + type.slice(1)} Title
              </h3>
              <p className="text-gray-700">{title}</p>
            </>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
          <div 
            className="rt-content border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto"
            dangerouslySetInnerHTML={{ 
              __html: description || '<p class="text-gray-500 italic">No description available</p>' 
            }}
          />
        </div>

        {/* Students Assigned Section - Only for class type */}
        {showStudents && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Students Assigned</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {loadingStudents ? 'Loading...' : `${students.length} student${students.length === 1 ? '' : 's'} enrolled`}
                </p>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-2 text-gray-500">
                  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
                    <path d="M22 12c0-5.523-4.477-10-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="text-sm">Loading students...</span>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No students assigned to this class yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {students.map((assignment) => {
                      const avatar = getAvatarDetails(assignment);
                      const studentName = getStudentName(assignment);
                      const studentEmail = assignment.student?.email;

                      return (
                        <div
                          key={assignment.id}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {avatar.type === 'image' ? (
                              <img
                                src={avatar.value}
                                alt={studentName}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    const initials = `${assignment.student?.first_name?.charAt(0) || ''}${assignment.student?.last_name?.charAt(0) || ''}`.trim().toUpperCase() || '??';
                                    parent.innerHTML = `<div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">${initials}</div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-200">
                                {avatar.value}
                              </div>
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {studentName}
                            </p>
                            {studentEmail && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {studentEmail}
                              </p>
                            )}
                          </div>

                          {/* Status Badge */}
                          {assignment.status !== undefined && (
                            <div className="flex-shrink-0">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  assignment.status === 1
                                    ? 'bg-green-100 text-green-800'
                                    : assignment.status === 2
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {assignment.status === 1 ? 'Active' : assignment.status === 2 ? 'Pending' : 'Inactive'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default DescriptionModal;
