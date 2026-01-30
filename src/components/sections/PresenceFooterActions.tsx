import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, Lock, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import type { ValidationStatus } from '../../constants/validationStatus';
import {
  isLocked,
  isTeacherValidated,
  canTeacherValidate,
  canControllerValidate,
} from '../../constants/validationStatus';
import type { PresenceViewMode } from './StudentPresenceSection';

interface PresenceFooterActionsProps {
  viewMode: PresenceViewMode;
  presenceValidationStatus: ValidationStatus | undefined | null;
  notesValidationStatus: ValidationStatus | undefined | null;
  isTeacher: boolean;
  isController: boolean;
  onGeneratePdf: () => void;
  onGenerateNotesPdf: () => void;
  /** Teacher: one-time activation (DRAFT → TEACHER_VALIDATED + session ACTIVATED). Controller cannot activate. */
  onActivatePresence: () => void;
  /** Controller: final validation (TEACHER_VALIDATED → LOCKED). */
  onValidatePresenceController: () => void;
  onValidateNotesTeacher: () => void;
  onValidateNotesController: () => void;
  isValidating?: boolean;
  isGeneratingPdf?: boolean;
  isGeneratingNotesPdf?: boolean;
  hasSession: boolean;
  /** If false, Notes module is disabled for this session; hide Notes PDF and notes validation. */
  hasNotes?: boolean;
  /** Presence: at least one student marked present (required for activation). */
  canValidatePresence?: boolean;
  /** Notes: at least one present student (for teacher validation). */
  canValidateNotes?: boolean;
  /** Session fully activated: presence LOCKED and (no notes or notes LOCKED). See SESSION_ACTIVATION.md. */
  sessionFullyActivated?: boolean;
}

const PresenceFooterActions: React.FC<PresenceFooterActionsProps> = ({
  viewMode,
  presenceValidationStatus,
  notesValidationStatus,
  isTeacher,
  isController,
  onGeneratePdf,
  onGenerateNotesPdf,
  onActivatePresence,
  onValidatePresenceController,
  onValidateNotesTeacher,
  onValidateNotesController,
  isValidating = false,
  isGeneratingPdf = false,
  isGeneratingNotesPdf = false,
  hasSession,
  hasNotes = true,
  canValidatePresence = true,
  canValidateNotes = true,
  sessionFullyActivated = false,
}) => {
  const { t } = useTranslation();

  if (!hasSession) return null;

  const presenceTeacherValidated = isTeacherValidated(presenceValidationStatus);
  const presenceLocked = isLocked(presenceValidationStatus);
  const notesTeacherValidated = isTeacherValidated(notesValidationStatus);
  const notesLocked = isLocked(notesValidationStatus);

  /** Teacher only: activate session (one-time). Controller cannot activate. */
  const showActivatePresence = viewMode === 'presence' && isTeacher && canTeacherValidate(presenceValidationStatus) && canValidatePresence;
  const showValidatePresenceControllerFinal = viewMode === 'presence' && isController && canControllerValidate(presenceValidationStatus);
  const showValidateNotesTeacher = viewMode === 'notes' && hasNotes && isTeacher && canTeacherValidate(notesValidationStatus) && canValidateNotes;
  const showValidateNotesControllerFinal = viewMode === 'notes' && hasNotes && isController && canControllerValidate(notesValidationStatus);

  const badgePresence = presenceLocked
    ? t('forms.finalControllerValidated')
    : presenceTeacherValidated
      ? t('forms.teacherValidated')
      : null;
  const badgeNotes = notesLocked
    ? t('forms.finalControllerValidated')
    : notesTeacherValidated
      ? t('forms.teacherValidated')
      : null;
  const badge = viewMode === 'presence' ? badgePresence : badgeNotes;
  /** When session is fully activated, show single clear state. */
  const displayBadge = sessionFullyActivated ? t('forms.sessionFullyValidated') : badge;

  return (
    <footer
      className="sticky bottom-0 left-0 right-0 z-10 mt-auto border-t border-gray-200 bg-white/95 backdrop-blur py-4 px-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
      aria-label={t('common.actions')}
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {displayBadge && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                sessionFullyActivated
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {sessionFullyActivated || presenceLocked || notesLocked ? (
                <Lock className="w-4 h-4" aria-hidden />
              ) : (
                <CheckCircle className="w-4 h-4" aria-hidden />
              )}
              {displayBadge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onGeneratePdf}
            disabled={isGeneratingPdf}
            isLoading={isGeneratingPdf}
          >
            <FileDown className="w-4 h-4 mr-2" aria-hidden />
            {t('forms.generatePdf')}
          </Button>
          {hasNotes && (
            <Button
              type="button"
              variant="secondary"
              onClick={onGenerateNotesPdf}
              disabled={isGeneratingNotesPdf}
              isLoading={isGeneratingNotesPdf}
            >
              <FileDown className="w-4 h-4 mr-2" aria-hidden />
              {t('forms.generateNotesPdf')}
            </Button>
          )}
          {showActivatePresence && (
            <Button
              type="button"
              variant="primary"
              onClick={onActivatePresence}
              disabled={isValidating || !canValidatePresence}
              isLoading={isValidating}
              title={!canValidatePresence ? t('forms.activatePresenceDisabledNoStudents') : undefined}
            >
              <CheckCircle className="w-4 h-4 mr-2" aria-hidden />
              {t('forms.activatePresence')}
            </Button>
          )}
          {showValidatePresenceControllerFinal && (
            <Button
              type="button"
              variant="primary"
              onClick={onValidatePresenceController}
              disabled={isValidating}
              isLoading={isValidating}
            >
              <Lock className="w-4 h-4 mr-2" aria-hidden />
              {t('forms.validatePresenceFinal')}
            </Button>
          )}
          {showValidateNotesTeacher && (
            <Button
              type="button"
              variant="primary"
              onClick={onValidateNotesTeacher}
              disabled={isValidating || !canValidateNotes}
              isLoading={isValidating}
            >
              <CheckCircle className="w-4 h-4 mr-2" aria-hidden />
              {t('forms.validateNotes')}
            </Button>
          )}
          {showValidateNotesControllerFinal && (
            <Button
              type="button"
              variant="primary"
              onClick={onValidateNotesController}
              disabled={isValidating}
              isLoading={isValidating}
            >
              <Lock className="w-4 h-4 mr-2" aria-hidden />
              {t('forms.validateNotesFinal')}
            </Button>
          )}
        </div>
      </div>
    </footer>
  );
};

export default PresenceFooterActions;
