import React, { Suspense } from 'react';
import AttestationsSection from '../../components/sections/AttestationsSection';

const AttestationsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <AttestationsSection />
    </Suspense>
  );
};

export default AttestationsPage;

