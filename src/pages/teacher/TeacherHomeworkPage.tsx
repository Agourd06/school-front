import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents, usePlanningStudent } from '../../hooks/usePlanningStudents';
import { useClassStudents } from '../../hooks/useClassStudents';
import { Button, Input } from '../../components/ui';
import { useCreateStudentLinkType } from '../../hooks/useStudentLinkTypes';

const TeacherHomeworkPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;
  const [selectedPlanning, setSelectedPlanning] = useState<number | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [homeworkUrl, setHomeworkUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

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

  const createLinkMut = useCreateStudentLinkType();

  const classStudents = classStudentsData?.data || [];

  const handleAssignHomework = async () => {
    if (!homeworkUrl || !title || selectedStudents.length === 0) {
      alert('Please fill in all required fields and select at least one student');
      return;
    }

    try {
      // Share homework link with each selected student
      const promises = selectedStudents.map((studentId) =>
        createLinkMut.mutateAsync({
          student_id: studentId,
          link: homeworkUrl,
          title: title,
          description: description
            ? `${description}${dueDate ? ` Due date: ${dueDate}` : ''}`
            : dueDate
            ? `Due date: ${dueDate}`
            : undefined,
          status: 2,
        })
      );

      await Promise.all(promises);
      alert('Homework assigned successfully!');
      setHomeworkUrl('');
      setTitle('');
      setDescription('');
      setDueDate('');
      setSelectedStudents([]);
    } catch (error) {
      alert('Failed to assign homework. Please try again.');
    }
  };

  const toggleStudent = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllStudents = () => {
    const allStudentIds = classStudents.map((cs) => cs.student?.id).filter(Boolean) as number[];
    setSelectedStudents(allStudentIds);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Assign Homework</h2>

      {/* Planning Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Session (to filter students by class)
        </label>
        <select
          value={selectedPlanning || ''}
          onChange={(e) => {
            setSelectedPlanning(e.target.value ? Number(e.target.value) : null);
            setSelectedStudents([]);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Choose a session...</option>
          {plannings?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.course?.title} - {p.class?.title} ({new Date(p.date_day).toLocaleDateString()})
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

          {/* Homework Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homework Document URL *
              </label>
              <Input
                type="url"
                value={homeworkUrl}
                onChange={(e) => setHomeworkUrl(e.target.value)}
                placeholder="https://example.com/homework-assignment.pdf"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Homework Title"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions for the homework"
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Student Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Students *
                </label>
                {classStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={selectAllStudents}
                    className="text-sm text-secondary hover:text-secondary/80"
                  >
                    Select All
                  </button>
                )}
              </div>
              <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                {classStudents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No students in this class.</p>
                ) : (
                  <div className="space-y-2">
                    {classStudents.map((classStudent) => {
                      const student = classStudent.student;
                      const isSelected = selectedStudents.includes(student?.id || 0);
                      return (
                        <label
                          key={classStudent.id}
                          className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(student?.id || 0)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm text-gray-900">
                            {student?.first_name} {student?.last_name}
                          </span>
                          <span className="text-xs text-gray-500">({student?.email})</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleAssignHomework}
              disabled={
                !homeworkUrl ||
                !title ||
                selectedStudents.length === 0 ||
                createLinkMut.isPending
              }
              variant="primary"
            >
              {createLinkMut.isPending ? 'Assigning...' : 'Assign Homework'}
            </Button>
          </div>
        </>
      )}

      {!selectedPlanning && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center text-gray-500">
          Please select a session to assign homework to students.
        </div>
      )}
    </div>
  );
};

export default TeacherHomeworkPage;

