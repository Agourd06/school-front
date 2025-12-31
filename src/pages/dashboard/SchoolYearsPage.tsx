import React, { Suspense } from 'react';
import SchoolYearsSection from '../../components/sections/SchoolYearsSection';

const SchoolYearsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <SchoolYearsSection />
    </Suspense>
  );
};

export default SchoolYearsPage;

