import React, { Suspense } from 'react';
import LevelsSection from '../../components/sections/LevelsSection';

const LevelsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <LevelsSection />
    </Suspense>
  );
};

export default LevelsPage;

