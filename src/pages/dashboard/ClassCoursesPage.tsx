import React, { Suspense } from 'react';
import ClassCoursesSection from '../../components/sections/ClassCoursesSection';

const ClassCoursesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <ClassCoursesSection />
    </Suspense>
  );
};

export default ClassCoursesPage;

