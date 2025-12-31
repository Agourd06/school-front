import React, { Suspense } from 'react';
import StudentReportDetailsSection from '../../components/sections/StudentReportDetailsSection';

const StudentReportDetailsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentReportDetailsSection />
    </Suspense>
  );
};

export default StudentReportDetailsPage;

