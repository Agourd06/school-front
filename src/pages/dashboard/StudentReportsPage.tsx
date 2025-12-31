import React, { Suspense } from 'react';
import StudentReportsSection from '../../components/sections/StudentReportsSection';

const StudentReportsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentReportsSection />
    </Suspense>
  );
};

export default StudentReportsPage;

