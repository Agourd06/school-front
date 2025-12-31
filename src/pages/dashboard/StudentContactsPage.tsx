import React, { Suspense } from 'react';
import StudentContactsSection from '../../components/sections/StudentContactsSection';

const StudentContactsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentContactsSection />
    </Suspense>
  );
};

export default StudentContactsPage;

