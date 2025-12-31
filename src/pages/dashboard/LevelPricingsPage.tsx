import React, { Suspense } from 'react';
import LevelPricingsSection from '../../components/sections/LevelPricingsSection';

const LevelPricingsPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading...</div>}>
      <LevelPricingsSection />
    </Suspense>
  );
};

export default LevelPricingsPage;

