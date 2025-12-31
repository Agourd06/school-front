import React, { Suspense } from 'react';
import StudentsSection from '../../components/sections/StudentsSection';

const StudentsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentsSection />
    </Suspense>
  );
};

export default StudentsPage;

