import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SchoolYearContextType {
  selectedSchoolYearId: number | null;
  setSelectedSchoolYearId: (id: number | null) => void;
  clearSelectedSchoolYear: () => void;
  navigateToPeriods?: () => void;
  setNavigateToPeriods: (fn: () => void) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

export const useSchoolYear = () => {
  const context = useContext(SchoolYearContext);
  if (context === undefined) {
    throw new Error('useSchoolYear must be used within a SchoolYearProvider');
  }
  return context;
};

interface SchoolYearProviderProps {
  children: ReactNode;
}

export const SchoolYearProvider: React.FC<SchoolYearProviderProps> = ({ children }) => {
  const [selectedSchoolYearId, setSelectedSchoolYearIdState] = useState<number | null>(null);
  const [navigateToPeriods, setNavigateToPeriodsState] = useState<(() => void) | undefined>(undefined);

  const setSelectedSchoolYearId = useCallback((id: number | null) => {
    setSelectedSchoolYearIdState(id);
  }, []);

  const clearSelectedSchoolYear = useCallback(() => {
    setSelectedSchoolYearIdState(null);
  }, []);

  const setNavigateToPeriods = useCallback((fn: () => void) => {
    setNavigateToPeriodsState(() => fn);
  }, []);

  return (
    <SchoolYearContext.Provider
      value={{
        selectedSchoolYearId,
        setSelectedSchoolYearId,
        clearSelectedSchoolYear,
        navigateToPeriods,
        setNavigateToPeriods,
      }}
    >
      {children}
    </SchoolYearContext.Provider>
  );
};

