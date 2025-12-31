import React, { Suspense } from 'react';
import ClassesSection from '../../components/sections/ClassesSection';

const ClassesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <ClassesSection />
    </Suspense>
  );
};

export default ClassesPage;

