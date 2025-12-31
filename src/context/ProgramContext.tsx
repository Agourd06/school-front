import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface ProgramContextType {
  selectedProgramId: number | null;
  setSelectedProgramId: (id: number | null) => void;
  clearSelectedProgram: () => void;
  navigateToSpecializations: (programId?: number) => void;
  navigateBackToPrograms: () => void;
}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
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
  const navigate = useNavigate();
  const [selectedProgramId, setSelectedProgramIdState] = useState<number | null>(null);

  const setSelectedProgramId = useCallback((id: number | null) => {
    setSelectedProgramIdState(id);
  }, []);

  const clearSelectedProgram = useCallback(() => {
    setSelectedProgramIdState(null);
  }, []);

  const navigateToSpecializations = useCallback((programId?: number) => {
    if (programId) {
      setSelectedProgramIdState(programId);
    }
    navigate('/specializations');
  }, [navigate]);

  const navigateBackToPrograms = useCallback(() => {
    navigate('/programs');
  }, [navigate]);

  return (
    <ProgramContext.Provider
      value={{
        selectedProgramId,
        setSelectedProgramId,
        clearSelectedProgram,
        navigateToSpecializations,
        navigateBackToPrograms,
      }}
    >
      {children}
    </ProgramContext.Provider>
  );
};

