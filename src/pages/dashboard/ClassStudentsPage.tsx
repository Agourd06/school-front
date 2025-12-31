import React, { Suspense } from 'react';
import ClassStudentsSection from '../../components/sections/ClassStudentsSection';

const ClassStudentsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <ClassStudentsSection />
    </Suspense>
  );
};

export default ClassStudentsPage;

