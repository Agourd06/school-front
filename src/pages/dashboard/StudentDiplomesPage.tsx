import React, { Suspense } from 'react';
import StudentDiplomesSection from '../../components/sections/StudentDiplomesSection';

const StudentDiplomesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentDiplomesSection />
    </Suspense>
  );
};

export default StudentDiplomesPage;

