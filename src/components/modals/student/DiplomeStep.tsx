import React from 'react';
import StudentDiplomeStepForm from '../../forms/StudentDiplomeStepForm';
import type { DiplomeFormData } from './types';
import type { StudentDiplome } from '../../../api/studentDiplome';

interface DiplomeStepProps {
  form: DiplomeFormData;
  errors: Record<string, string>;
  diplomeFile1: File | null;
  diplomeFile2: File | null;
  currentDiplomePicture1?: string | null;
  currentDiplomePicture2?: string | null;
  studentName: string;
  studentPicture?: string | null;
  onFormChange: (field: keyof DiplomeFormData, value: string | number | '') => void;
  onFile1Change: (file: File | null) => void;
  onFile2Change: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasDiplome: boolean;
  justSaved?: boolean;
  onAddAnother?: () => void;
  onContinue?: () => void;
  allDiplomes?: StudentDiplome[];
  onEditDiplome?: (diplome: StudentDiplome) => void;
  onDeleteDiplome?: (diplomeId: number) => void;
  currentDiplomeId?: number;
  isDeletingDiplome?: boolean;
}

const DiplomeStep: React.FC<DiplomeStepProps> = (props) => {
  return <StudentDiplomeStepForm {...props} />;
};

export default DiplomeStep;

