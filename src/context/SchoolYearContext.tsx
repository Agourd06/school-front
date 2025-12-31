import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SchoolYearContextType {
  selectedSchoolYearId: number | null;
  setSelectedSchoolYearId: (id: number | null) => void;
  clearSelectedSchoolYear: () => void;
  navigateToPeriods: (schoolYearId?: number) => void;
}

const SchoolYearContext = createContext<SchoolYearContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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
  const navigate = useNavigate();
  const [selectedSchoolYearId, setSelectedSchoolYearIdState] = useState<number | null>(null);

  const setSelectedSchoolYearId = useCallback((id: number | null) => {
    setSelectedSchoolYearIdState(id);
  }, []);

  const clearSelectedSchoolYear = useCallback(() => {
    setSelectedSchoolYearIdState(null);
  }, []);

  const navigateToPeriods = useCallback((schoolYearId?: number) => {
    if (schoolYearId) {
      setSelectedSchoolYearIdState(schoolYearId);
    }
    navigate('/school-year-periods');
  }, [navigate]);

  return (
    <SchoolYearContext.Provider
      value={{
        selectedSchoolYearId,
        setSelectedSchoolYearId,
        clearSelectedSchoolYear,
        navigateToPeriods,
      }}
    >
      {children}
    </SchoolYearContext.Provider>
  );
};

