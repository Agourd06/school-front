import React, { Suspense } from 'react';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { useAuth } from '../../hooks/useAuth';
import StudentPresenceSection from '../../components/sections/StudentPresenceSection';

const TeacherGradesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id ?? null;

  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentPresenceSection viewMode="notes" teacherId={teacherId ?? undefined} />
    </Suspense>
  );
};

export default TeacherGradesPage;
