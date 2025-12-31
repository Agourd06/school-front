import React, { Suspense } from 'react';
import StudentAttestationsSection from '../../components/sections/StudentAttestationsSection';

const StudentAttestationsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentAttestationsSection />
    </Suspense>
  );
};

export default StudentAttestationsPage;

