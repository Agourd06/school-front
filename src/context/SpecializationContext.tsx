import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface SpecializationContextType {
  selectedSpecializationId: number | null;
  setSelectedSpecializationId: (id: number | null) => void;
  clearSelectedSpecialization: () => void;
  navigateToLevels?: () => void;
  setNavigateToLevels: (fn: () => void) => void;
}

const SpecializationContext = createContext<SpecializationContextType | undefined>(undefined);

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
  const [selectedSpecializationId, setSelectedSpecializationIdState] = useState<number | null>(null);
  const [navigateToLevels, setNavigateToLevelsState] = useState<(() => void) | undefined>(undefined);

  const setSelectedSpecializationId = useCallback((id: number | null) => {
    setSelectedSpecializationIdState(id);
  }, []);

  const clearSelectedSpecialization = useCallback(() => {
    setSelectedSpecializationIdState(null);
  }, []);

  const setNavigateToLevels = useCallback((fn: () => void) => {
    setNavigateToLevelsState(() => fn);
  }, []);

  return (
    <SpecializationContext.Provider
      value={{
        selectedSpecializationId,
        setSelectedSpecializationId,
        clearSelectedSpecialization,
        navigateToLevels,
        setNavigateToLevels,
      }}
    >
      {children}
    </SpecializationContext.Provider>
  );
};

