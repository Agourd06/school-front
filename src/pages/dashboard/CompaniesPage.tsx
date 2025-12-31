import React, { Suspense } from 'react';
import CompaniesSection from '../../components/sections/CompaniesSection';

const CompaniesPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <CompaniesSection />
    </Suspense>
  );
};

export default CompaniesPage;

