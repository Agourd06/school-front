import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentWithClass } from '../../hooks/useStudents';

const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: studentByEmail, isLoading: loadingStudent } = useStudentByEmail(user?.email);
  const studentId = studentByEmail?.id;

  // Get student with their active class (includes class_id)
  const { data: studentWithClass, isLoading: loadingDetails } = useStudentWithClass(studentId || 0);
  const student = studentWithClass?.student;
  const studentClass = studentWithClass?.class;

  if (loadingStudent || loadingDetails) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your dashboard...</div>
      </div>
    );
  }

  if (!studentId || !student) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Student profile not found</div>
        <p className="text-sm text-gray-400">
          Please contact your administrator to set up your student account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {student.first_name} {student.last_name}
            </h2>
            <p className="text-blue-100">{student.email}</p>
            {studentClass && (
              <p className="text-blue-100 mt-1">Class: {studentClass.title}</p>
            )}
            {studentClass?.specialization && (
              <p className="text-blue-100 mt-1">Specialization: {studentClass.specialization.title}</p>
            )}
            {studentClass?.level && (
              <p className="text-blue-100 mt-1">Level: {studentClass.level.title}</p>
            )}
          </div>
          {student.picture && (
            <img
              src={student.picture}
              alt={`${student.first_name} ${student.last_name}`}
              className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
            />
          )}
        </div>
      </div>

    </div>
  );
};

export default StudentDashboardPage;

