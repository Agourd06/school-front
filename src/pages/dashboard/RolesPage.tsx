import React, { Suspense } from 'react';
import RolesSection from '../../components/sections/RolesSection';

const RolesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <RolesSection />
    </Suspense>
  );
};

export default RolesPage;
