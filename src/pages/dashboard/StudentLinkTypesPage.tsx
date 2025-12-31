import React, { Suspense } from 'react';
import StudentLinkTypesSection from '../../components/sections/StudentLinkTypesSection';

const StudentLinkTypesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentLinkTypesSection />
    </Suspense>
  );
};

export default StudentLinkTypesPage;

