import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePlanningStudent } from '../../hooks/usePlanningStudents';
import { useClassStudents } from '../../hooks/useClassStudents';
import { useStudentPresences, useCreateStudentPresence, useUpdateStudentPresence } from '../../hooks/useStudentPresence';
import type { PresenceValue } from '../../api/studentPresence';

const TeacherAttendancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const planningId = searchParams.get('planning');
  const planningIdNum = planningId ? Number(planningId) : null;

  const { data: planning, isLoading: loadingPlanning } = usePlanningStudent(planningIdNum || 0);
  const classId = planning?.class_id;

  const { data: classStudentsData, isLoading: loadingStudents } = useClassStudents({
    class_id: classId,
    status: 1, // Active students only
  });

  const { data: presencesData, isLoading: loadingPresences } = useStudentPresences({
    student_planning_id: planningIdNum || undefined,
  });

  const createPresenceMut = useCreateStudentPresence();
  const updatePresenceMut = useUpdateStudentPresence();

  const students = classStudentsData?.data || [];
  const presences = presencesData?.data || [];

  // Create a map of student_id -> presence
  const presenceMap = new Map(presences.map((p) => [p.student_id, p]));

  const [localPresences, setLocalPresences] = useState<Map<number, PresenceValue>>(new Map());

  useEffect(() => {
    const map = new Map<number, PresenceValue>();
    presences.forEach((p) => {
      map.set(p.student_id, p.presence);
    });
    setLocalPresences(map);
  }, [presences]);

  const handlePresenceChange = async (studentId: number, presence: PresenceValue) => {
    setLocalPresences((prev) => new Map(prev).set(studentId, presence));

    const existing = presenceMap.get(studentId);

    if (existing) {
      // Update existing presence
      const presenceRecord = presences.find((p) => p.student_id === studentId);
      if (presenceRecord) {
        await updatePresenceMut.mutateAsync({
          id: presenceRecord.id,
          data: { presence },
        });
      }
    } else {
      // Create new presence
      if (planningIdNum) {
        await createPresenceMut.mutateAsync({
          student_id: studentId,
          student_planning_id: planningIdNum,
          presence,
          note: -1,
          status: 2,
        });
      }
    }
  };

  const getPresenceColor = (presence: PresenceValue | undefined) => {
    switch (presence) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loadingPlanning || loadingStudents || loadingPresences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading attendance data...</div>
      </div>
    );
  }

  if (!planningIdNum || !planning) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No planning session selected</p>
        <p className="text-sm text-gray-400">
          Please select a session from your schedule to manage attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Info */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          {planning.course?.title || `Course #${planning.course_id}`}
        </h2>
        <div className="text-blue-100 space-y-1">
          <p>
            <strong>Class:</strong> {planning.class?.title || `Class #${planning.class_id}`}
          </p>
          <p>
            <strong>Date:</strong> {new Date(planning.date_day).toLocaleDateString()}
          </p>
          <p>
            <strong>Time:</strong> {planning.hour_start} - {planning.hour_end}
          </p>
          {planning.classRoom && (
            <p>
              <strong>Room:</strong> {planning.classRoom.title}
            </p>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Attendance</h3>
        </div>
        {students.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No students enrolled in this class.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((classStudent) => {
                  const student = classStudent.student;
                  const currentPresence = localPresences.get(student?.id || 0);

                  return (
                    <tr key={classStudent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student?.first_name} {student?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{student?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentPresence ? (
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getPresenceColor(
                              currentPresence
                            )}`}
                          >
                            {currentPresence.charAt(0).toUpperCase() + currentPresence.slice(1)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Not marked</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={currentPresence || ''}
                          onChange={(e) => {
                            const value = e.target.value as PresenceValue;
                            if (value) {
                              handlePresenceChange(student?.id || 0, value);
                            }
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          disabled={
                            createPresenceMut.isPending || updatePresenceMut.isPending
                          }
                        >
                          <option value="">Select...</option>
                          <option value="present">Present</option>
                          <option value="absent">Absent</option>
                          <option value="late">Late</option>
                          <option value="excused">Excused</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.from(localPresences.values()).filter((p) => p === 'present').length}
              </div>
              <div className="text-sm text-gray-600">Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Array.from(localPresences.values()).filter((p) => p === 'absent').length}
              </div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Array.from(localPresences.values()).filter((p) => p === 'late').length}
              </div>
              <div className="text-sm text-gray-600">Late</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Array.from(localPresences.values()).filter((p) => p === 'excused').length}
              </div>
              <div className="text-sm text-gray-600">Excused</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendancePage;

