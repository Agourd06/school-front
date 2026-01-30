import React, { Suspense } from 'react';
import StudentPresenceSection from '../../components/sections/StudentPresenceSection';

const StudentPresencePage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <StudentPresenceSection viewMode="presence" />
    </Suspense>
  );
};

export default StudentPresencePage;

