import React, { Suspense } from 'react';
import AdministratorsSection from '../../components/sections/AdministratorsSection';

const AdministratorsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <AdministratorsSection />
    </Suspense>
  );
};

export default AdministratorsPage;

