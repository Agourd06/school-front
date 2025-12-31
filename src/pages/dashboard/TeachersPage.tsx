import React, { Suspense } from 'react';
import TeachersSection from '../../components/sections/TeachersSection';

const TeachersPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <TeachersSection />
    </Suspense>
  );
};

export default TeachersPage;

