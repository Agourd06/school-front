import React, { Suspense } from 'react';
import CoursesSection from '../../components/sections/CoursesSection';

const CoursesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <CoursesSection />
    </Suspense>
  );
};

export default CoursesPage;

