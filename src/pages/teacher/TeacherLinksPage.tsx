import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents, usePlanningStudent } from '../../hooks/usePlanningStudents';
import { useClassStudents } from '../../hooks/useClassStudents';
import { useStudents } from '../../hooks/useStudents';
import { Button, Input } from '../../components/ui';
import { useCreateStudentLinkType } from '../../hooks/useStudentLinkTypes';

const TeacherLinksPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;
  const [selectedPlanning, setSelectedPlanning] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

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

  const { data: studentsData } = useStudents({
    page: 1,
    limit: 100,
  });

  const createLinkMut = useCreateStudentLinkType();

  const classStudents = classStudentsData?.data || [];
  const allStudents = studentsData?.data || [];

  // Get students from the selected class
  const availableStudents = selectedPlanning && classId
    ? classStudents.map((cs) => cs.student).filter(Boolean)
    : allStudents;

  const handleShareLink = async () => {
    if (!selectedStudent || !link || !title) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await createLinkMut.mutateAsync({
        student_id: selectedStudent,
        link,
        title,
        description: description || undefined,
        status: 2,
      });
      alert('Link shared successfully!');
      setLink('');
      setTitle('');
      setDescription('');
      setSelectedStudent(null);
    } catch (error) {
      alert('Failed to share link. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Share Links with Students</h2>

      {/* Planning Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Session (Optional - to filter students by class)
        </label>
        <select
          value={selectedPlanning || ''}
          onChange={(e) => setSelectedPlanning(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All students</option>
          {plannings?.data.map((p) => (
            <option key={p.id} value={p.id}>
              {p.course?.title} - {p.class?.title} ({new Date(p.date_day).toLocaleDateString()})
            </option>
          ))}
        </select>
      </div>

      {/* Link Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student *
          </label>
          <select
            value={selectedStudent || ''}
            onChange={(e) => setSelectedStudent(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Choose a student...</option>
            {availableStudents.map((student) => (
              <option key={student?.id} value={student?.id}>
                {student?.first_name} {student?.last_name} ({student?.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link URL *
          </label>
          <Input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com/resource"
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
            placeholder="Link Title"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description of the link"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <Button
          onClick={handleShareLink}
          disabled={!selectedStudent || !link || !title || createLinkMut.isPending}
          variant="primary"
        >
          {createLinkMut.isPending ? 'Sharing...' : 'Share Link'}
        </Button>
      </div>
    </div>
  );
};

export default TeacherLinksPage;

