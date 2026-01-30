/**
 * Two-step validation workflow for Presence and Notes.
 * Presence and Notes have independent validation states.
 */

export type ValidationStatus = 0 | 1 | 2;

export const VALIDATION_DRAFT: ValidationStatus = 0;
export const VALIDATION_TEACHER_VALIDATED: ValidationStatus = 1;
export const VALIDATION_LOCKED: ValidationStatus = 2;

export const VALIDATION_STATUS_LABEL: Record<ValidationStatus, string> = {
  [VALIDATION_DRAFT]: 'Draft',
  [VALIDATION_TEACHER_VALIDATED]: 'Teacher validated',
  [VALIDATION_LOCKED]: 'Locked',
};

/** Data is editable only when status is DRAFT (and user is teacher). */
export function isEditable(status: ValidationStatus | undefined | null): boolean {
  return status === undefined || status === null || status === VALIDATION_DRAFT;
}

/** Data is read-only for teacher when TEACHER_VALIDATED or LOCKED. */
export function isReadOnlyForTeacher(status: ValidationStatus | undefined | null): boolean {
  return status === VALIDATION_TEACHER_VALIDATED || status === VALIDATION_LOCKED;
}

/** Data is final and permanently read-only when LOCKED. */
export function isLocked(status: ValidationStatus | undefined | null): boolean {
  return status === VALIDATION_LOCKED;
}

/** PDF should show "Teacher Validated" when status is TEACHER_VALIDATED. */
export function isTeacherValidated(status: ValidationStatus | undefined | null): boolean {
  return status === VALIDATION_TEACHER_VALIDATED;
}

/** Controller can perform final validation when status is TEACHER_VALIDATED. */
export function canControllerValidate(status: ValidationStatus | undefined | null): boolean {
  return status === VALIDATION_TEACHER_VALIDATED;
}

/** Teacher can perform first validation when status is DRAFT. */
export function canTeacherValidate(status: ValidationStatus | undefined | null): boolean {
  return isEditable(status);
}

/** Planning with optional new boolean validation fields. See VALIDATION_BOOLEANS_BACKEND.md. */
export interface PlanningValidationBooleans {
  presence_validation_status?: number | null;
  notes_validation_status?: number | null;
  has_notes?: boolean | null;
  presence_validated_teacher?: boolean | null;
  presence_validated_controleur?: boolean | null;
  notes_validated_teacher?: boolean | null;
  notes_validated_controleur?: boolean | null;
}

/** Derive presence ValidationStatus (0/1/2) from new booleans. */
export function getPresenceValidationStatusFromBooleans(planning: PlanningValidationBooleans): ValidationStatus {
  const t = planning.presence_validated_teacher === true;
  const c = planning.presence_validated_controleur === true;
  if (t && c) return VALIDATION_LOCKED;
  if (t) return VALIDATION_TEACHER_VALIDATED;
  return VALIDATION_DRAFT;
}

/** Derive notes ValidationStatus (0/1/2) from new booleans. */
export function getNotesValidationStatusFromBooleans(planning: PlanningValidationBooleans): ValidationStatus {
  const t = planning.notes_validated_teacher === true;
  const c = planning.notes_validated_controleur === true;
  if (t && c) return VALIDATION_LOCKED;
  if (t) return VALIDATION_TEACHER_VALIDATED;
  return VALIDATION_DRAFT;
}

/** Get presence validation status: use new booleans if present, else legacy presence_validation_status. */
export function getPresenceValidationStatus(planning: PlanningValidationBooleans): ValidationStatus {
  if (planning.presence_validated_teacher !== undefined || planning.presence_validated_controleur !== undefined) {
    return getPresenceValidationStatusFromBooleans(planning);
  }
  if (planning.presence_validation_status != null) return planning.presence_validation_status as ValidationStatus;
  return VALIDATION_DRAFT;
}

/** Get notes validation status: use new booleans if present, else legacy notes_validation_status. */
export function getNotesValidationStatus(planning: PlanningValidationBooleans): ValidationStatus {
  if (planning.notes_validated_teacher !== undefined || planning.notes_validated_controleur !== undefined) {
    return getNotesValidationStatusFromBooleans(planning);
  }
  if (planning.notes_validation_status != null) return planning.notes_validation_status as ValidationStatus;
  return VALIDATION_DRAFT;
}

/**
 * Session is fully activated when both teacher and controller have validated presence,
 * and if has_notes, both have validated notes. See VALIDATION_BOOLEANS_BACKEND.md and SESSION_ACTIVATION.md.
 */
export function isSessionFullyActivated(planning: PlanningValidationBooleans): boolean {
  const useBooleans =
    planning.presence_validated_teacher !== undefined || planning.presence_validated_controleur !== undefined ||
    planning.notes_validated_teacher !== undefined || planning.notes_validated_controleur !== undefined;
  const hasNotes = planning.has_notes !== false;

  if (useBooleans) {
    const presenceLocked =
      planning.presence_validated_teacher === true && planning.presence_validated_controleur === true;
    const notesLocked =
      !hasNotes ||
      (planning.notes_validated_teacher === true && planning.notes_validated_controleur === true);
    return presenceLocked && notesLocked;
  }

  const presenceLocked = planning.presence_validation_status === VALIDATION_LOCKED;
  const notesLocked = !hasNotes || planning.notes_validation_status === VALIDATION_LOCKED;
  return presenceLocked && notesLocked;
}
