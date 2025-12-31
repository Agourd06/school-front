import React, { Suspense } from 'react';
import PlanningSection from '../../components/sections/PlanningSection';

const PlanningPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <PlanningSection />
    </Suspense>
  );
};

export default PlanningPage;

