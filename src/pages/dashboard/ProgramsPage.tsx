import React, { Suspense } from 'react';
import ProgramsSection from '../../components/sections/ProgramsSection';

const ProgramsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <ProgramsSection />
    </Suspense>
  );
};

export default ProgramsPage;

