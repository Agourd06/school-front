import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents, usePlanningStudent } from '../../hooks/usePlanningStudents';
import { useStudentPresences, useUpdateStudentPresence } from '../../hooks/useStudentPresence';
import { useClassStudents } from '../../hooks/useClassStudents';
import { Button, Input } from '../../components/ui';

const TeacherGradesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;
  const [selectedPlanning, setSelectedPlanning] = useState<number | null>(null);

  const { data: plannings } = usePlanningStudents({
    teacher_id: teacherId,
    order: 'ASC',
    limit: 50,
  });

  const { data: planning } = usePlanningStudent(selectedPlanning || 0);
  const classId = planning?.class_id;

  const { data: classStudentsData } = useClassStudents({
    class_id: classId,
    status: 1,
  });

  const { data: presencesData } = useStudentPresences({
    student_planning_id: selectedPlanning || undefined,
  });

  const updatePresenceMut = useUpdateStudentPresence();

  const students = classStudentsData?.data || [];
  const presences = presencesData?.data || [];
  const presenceMap = new Map(presences.map((p) => [p.student_id, p]));

  const [localGrades, setLocalGrades] = useState<Map<number, { note: string; remarks: string }>>(new Map());

  React.useEffect(() => {
    // Initialize local grades
    const localMap = new Map<number, { note: string; remarks: string }>();
    presences.forEach((p) => {
      localMap.set(p.student_id, {
        note: p.note === -1 ? '' : String(p.note),
        remarks: p.remarks || '',
      });
    });
    setLocalGrades(localMap);
  }, [presences]);

  const handleGradeChange = async (studentId: number, note: number, remarks: string) => {

    const presence = presenceMap.get(studentId);
    if (presence) {
      await updatePresenceMut.mutateAsync({
        id: presence.id,
        data: { note, remarks },
      });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Assign Grades</h2>

      {/* Planning Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Session
        </label>
        <select
          value={selectedPlanning || ''}
          onChange={(e) => setSelectedPlanning(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a session...</option>
          {plannings?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.course?.title} - {new Date(p.date_day).toLocaleDateString()} ({p.hour_start} - {p.hour_end})
            </option>
          ))}
        </select>
      </div>

      {selectedPlanning && planning && (
        <>
          {/* Session Info */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <h3 className="text-xl font-bold mb-2">
              {planning.course?.title || `Course #${planning.course_id}`}
            </h3>
            <p className="text-blue-100">
              {planning.class?.title} • {new Date(planning.date_day).toLocaleDateString()}
            </p>
          </div>

          {/* Grades Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Student Grades</h3>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Grade (0-20)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((classStudent) => {
                      const student = classStudent.student;
                      const studentId = student?.id || 0;
                      const localGrade = localGrades.get(studentId) || { note: '', remarks: '' };

                      return (
                        <tr key={classStudent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student?.first_name} {student?.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={localGrade.note}
                              onChange={(e) => {
                                setLocalGrades((prev) => {
                                  const newMap = new Map(prev);
                                  newMap.set(studentId, { ...localGrade, note: e.target.value });
                                  return newMap;
                                });
                              }}
                              placeholder="Grade"
                              className="w-24"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <Input
                              type="text"
                              value={localGrade.remarks}
                              onChange={(e) => {
                                setLocalGrades((prev) => {
                                  const newMap = new Map(prev);
                                  newMap.set(studentId, { ...localGrade, remarks: e.target.value });
                                  return newMap;
                                });
                              }}
                              placeholder="Remarks (optional)"
                              className="w-full"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Button
                              onClick={() => {
                                const noteValue = localGrade.note ? parseFloat(localGrade.note) : -1;
                                if (noteValue >= 0 && noteValue <= 20) {
                                  handleGradeChange(studentId, noteValue, localGrade.remarks);
                                }
                              }}
                              disabled={updatePresenceMut.isPending}
                              variant="primary"
                              className="text-sm"
                            >
                              Save
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeacherGradesPage;

