import React, { Suspense } from 'react';
import PlanningSessionTypesSection from '../../components/sections/PlanningSessionTypesSection';

const PlanningSessionTypesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-muted">Loading...</div>}>
      <PlanningSessionTypesSection />
    </Suspense>
  );
};

export default PlanningSessionTypesPage;

