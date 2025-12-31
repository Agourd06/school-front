import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SpecializationContextType {
  selectedSpecializationId: number | null;
  setSelectedSpecializationId: (id: number | null) => void;
  clearSelectedSpecialization: () => void;
  navigateToLevels: (specializationId?: number) => void;
  navigateBackToSpecializations: () => void;
}

const SpecializationContext = createContext<SpecializationContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useSpecialization = () => {
  const context = useContext(SpecializationContext);
  if (context === undefined) {
    throw new Error('useSpecialization must be used within a SpecializationProvider');
  }
  return context;
};

interface SpecializationProviderProps {
  children: ReactNode;
}

export const SpecializationProvider: React.FC<SpecializationProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const [selectedSpecializationId, setSelectedSpecializationIdState] = useState<number | null>(null);

  const setSelectedSpecializationId = useCallback((id: number | null) => {
    setSelectedSpecializationIdState(id);
  }, []);

  const clearSelectedSpecialization = useCallback(() => {
    setSelectedSpecializationIdState(null);
  }, []);

  const navigateToLevels = useCallback((specializationId?: number) => {
    if (specializationId) {
      setSelectedSpecializationIdState(specializationId);
    }
    navigate('/levels');
  }, [navigate]);

  const navigateBackToSpecializations = useCallback(() => {
    navigate('/specializations');
  }, [navigate]);

  return (
    <SpecializationContext.Provider
      value={{
        selectedSpecializationId,
        setSelectedSpecializationId,
        clearSelectedSpecialization,
        navigateToLevels,
        navigateBackToSpecializations,
      }}
    >
      {children}
    </SpecializationContext.Provider>
  );
};

