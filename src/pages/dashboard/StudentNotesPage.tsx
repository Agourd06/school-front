import React, { Suspense } from 'react';
import StudentNotesSection from '../../components/sections/StudentNotesSection';

const StudentNotesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentNotesSection />
    </Suspense>
  );
};

export default StudentNotesPage;

