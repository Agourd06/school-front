import React, { Suspense } from 'react';
import ModulesSection from '../../components/sections/ModulesSection';

const ModulesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <ModulesSection />
    </Suspense>
  );
};

export default ModulesPage;

