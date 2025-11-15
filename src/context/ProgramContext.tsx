import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface ProgramContextType {
  selectedProgramId: number | null;
  setSelectedProgramId: (id: number | null) => void;
  clearSelectedProgram: () => void;
  navigateToSpecializations?: () => void;
  setNavigateToSpecializations: (fn: () => void) => void;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

export const useProgram = () => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
};

interface ProgramProviderProps {
  children: ReactNode;
}

export const ProgramProvider: React.FC<ProgramProviderProps> = ({ children }) => {
  const [selectedProgramId, setSelectedProgramIdState] = useState<number | null>(null);
  const [navigateToSpecializations, setNavigateToSpecializationsState] = useState<(() => void) | undefined>(undefined);

  const setSelectedProgramId = useCallback((id: number | null) => {
    setSelectedProgramIdState(id);
  }, []);

  const clearSelectedProgram = useCallback(() => {
    setSelectedProgramIdState(null);
  }, []);

  const setNavigateToSpecializations = useCallback((fn: () => void) => {
    setNavigateToSpecializationsState(() => fn);
  }, []);

  return (
    <ProgramContext.Provider
      value={{
        selectedProgramId,
        setSelectedProgramId,
        clearSelectedProgram,
        navigateToSpecializations,
        setNavigateToSpecializations,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

