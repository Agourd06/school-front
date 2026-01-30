import React, { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar, CheckCircle2, XCircle, Circle, AlertCircle, Info } from 'lucide-react';
import type { StudentPresence } from '../../api/studentPresence';
import type { ClassStudentAssignment } from '../../api/classStudent';
import type { StudentPresenceStatus } from '../../api/studentPresence';
import {
  useStudentPresences,
  useCreateStudentPresence,
  useUpdateStudentPresence,
} from '../../hooks/useStudentPresence';
import { usePlanningStudents, useUpdatePlanningStudent } from '../../hooks/usePlanningStudents';
import { useClassStudents } from '../../hooks/useClassStudents';
import type { ValidationStatus } from '../../constants/validationStatus';
import {
  VALIDATION_DRAFT,
  isEditable,
  isLocked,
  isTeacherValidated,
  isSessionFullyActivated,
  getPresenceValidationStatus,
  getNotesValidationStatus,
} from '../../constants/validationStatus';
import { PLANNING_STATUS_ACTIVATED } from '../../constants/planning';
import { exportPresencePdf } from '../../utils/exportPresencePdf';
import { exportNotesPdf } from '../../utils/exportNotesPdf';
import BaseModal from '../modals/BaseModal';
import SessionOverviewModal from '../modals/SessionOverviewModal';
import ValidationConfirmationModal from '../modals/ValidationConfirmationModal';
import PresenceFooterActions from './PresenceFooterActions';
import StudentDetailsButton from '../reportSection/StudentDetailsButton';
import Avatar from '../ui/Avatar';
import { getFileUrl } from '../../utils/apiConfig';
import { formatPlanningDetail } from '../../utils/formatPlanningDetail';
import { ToastContainer, type ToastType } from '../ui/Toast';
import Button from '../ui/Button';
import { PageHeader } from '../ui';
import { ClipboardCheck } from 'lucide-react';

const formatStudentName = (
  presence: StudentPresence | undefined,
  classStudent: ClassStudentAssignment | undefined,
  t: (key: string) => string
) => {
  const student = presence?.student ?? classStudent?.student;
  const first = student?.first_name ?? '';
  const last = student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || student?.email || `${t('forms.studentNumber')}${student?.id ?? presence?.student_id ?? classStudent?.student_id ?? '—'}`;
};

const getPresenceLabel = (t: (key: string) => string): Record<string, string> => ({
  present: t('sections.present'),
  absent: t('sections.absent'),
  late: t('sections.late'),
  excused: t('sections.excused'),
  'not-marked': t('forms.notMarked'),
});

const getPresenceIcon = (status: string) => {
  switch (status) {
    case 'present':
      return CheckCircle2;
    case 'absent':
      return XCircle;
    case 'late':
      return AlertCircle;
    case 'excused':
      return Circle;
    default:
      return Circle;
  }
};

const presenceStyles: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  present: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600',
  },
  absent: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600',
  },
  late: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600',
  },
  excused: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    icon: 'text-purple-600',
  },
  'not-marked': {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    icon: 'text-gray-500',
  },
};

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
};

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  undoAction?: () => void;
}

const getTodayDateString = () => new Date().toISOString().slice(0, 10);

export type PresenceViewMode = 'presence' | 'notes';

interface StudentPresenceSectionProps {
  /** When 'presence', only the presence interface is shown. When 'notes', only the notes interface. No in-page switcher. */
  viewMode?: PresenceViewMode;
  /** When set (e.g. teacher context), plannings are filtered to this teacher only. */
  teacherId?: number | null;
}

const StudentPresenceSection: React.FC<StudentPresenceSectionProps> = ({ viewMode: viewModeProp = 'presence', teacherId }) => {
  const viewMode = viewModeProp;
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPlanningId = searchParams.get('planning') ?? '';
  const [selectedPlanningId, setSelectedPlanningId] = useState<string>('');
  const [planningDate, setPlanningDate] = useState(getTodayDateString);
  const hasInitializedFromUrl = useRef(false);
  const [overviewPlanningId, setOverviewPlanningId] = useState<number | null>(null);
  const [confirmValidation, setConfirmValidation] = useState<
    'presence_teacher' | 'presence_controller' | 'notes_teacher' | 'notes_controller' | null
  >(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingNotesPdf, setIsGeneratingNotesPdf] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const presenceLabel = useMemo(() => getPresenceLabel(t), [t]);
  const [noteEditor, setNoteEditor] = useState<{
    presence: StudentPresence | null;
    note: string;
    remarks: string;
  }>({ presence: null, note: '-1', remarks: '' });

  const studentCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const presenceParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      student_planning_id: selectedPlanningId ? Number(selectedPlanningId) : undefined,
    }),
    [selectedPlanningId]
  );

  const {
    data: presenceResp,
    isLoading: presenceLoading,
    error: presenceError,
    refetch: refetchPresences,
  } = useStudentPresences(presenceParams);

  const presences = useMemo(() => presenceResp?.data ?? [], [presenceResp]);

  const planningQueryParams = useMemo(
    () => ({
      page: 1,
      limit: 100,
      ...(teacherId != null ? { teacher_id: teacherId } : {}),
    }),
    [teacherId]
  );
  const { data: planningResp, isLoading: planningLoading } = usePlanningStudents(planningQueryParams);

  const filteredPlannings = useMemo(() => {
    const all = planningResp?.data || [];
    const now = new Date();
    const byDate = !planningDate
      ? all
      : all.filter((planning) => planning.date_day && planning.date_day.startsWith(planningDate));
    return byDate.filter((planning) => {
      if (!planning.date_day || !planning.hour_start) return false;
      const sessionStart = new Date(`${planning.date_day}T${planning.hour_start}`);
      if (Number.isNaN(sessionStart.getTime())) return false;
      if (sessionStart <= now) return true;
      // Teacher: show all sessions for the date so a session opened from schedule stays selectable
      if (teacherId != null) return true;
      return false;
    });
  }, [planningResp, planningDate, teacherId]);

  // When URL has ?planning=ID, select that session and set date once plannings are loaded
  useEffect(() => {
    if (planningLoading || hasInitializedFromUrl.current || !urlPlanningId) return;
    const all = planningResp?.data || [];
    const planning = all.find((p) => String(p.id) === urlPlanningId);
    if (planning?.date_day) {
      setPlanningDate(planning.date_day.slice(0, 10));
      setSelectedPlanningId(urlPlanningId);
      hasInitializedFromUrl.current = true;
    }
  }, [planningLoading, planningResp?.data, urlPlanningId]);

  useEffect(() => {
    if (!selectedPlanningId) return;
    const exists = filteredPlannings.some((planning) => planning.id === Number(selectedPlanningId));
    if (!exists) {
      setSelectedPlanningId('');
      setNoteEditor({ presence: null, note: '-1', remarks: '' });
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('planning');
        return next;
      }, { replace: true });
    }
  }, [filteredPlannings, selectedPlanningId]);

  const selectedPlanning = useMemo(
    () =>
      selectedPlanningId
        ? (planningResp?.data || []).find((planning) => planning.id === Number(selectedPlanningId))
        : null,
    [planningResp, selectedPlanningId]
  );

  /** Notes module is available only when session has_notes !== false. Default true for backward compat. */
  const hasNotes = selectedPlanning?.has_notes !== false;

  const {
    data: classStudentsResp,
    isLoading: classStudentsLoading,
    error: classStudentsError,
  } = useClassStudents(
    selectedPlanning?.class_id ? { class_id: selectedPlanning.class_id, limit: 100 } : {}
  );

  const classStudents = useMemo(() => classStudentsResp?.data ?? [], [classStudentsResp]);

  const classStudentMap = useMemo(() => {
    const map = new Map<number, ClassStudentAssignment>();
    classStudents.forEach((assignment) => {
      if (assignment.student_id) {
        map.set(assignment.student_id, assignment);
      }
    });
    return map;
  }, [classStudents]);

  /** One row per student per session. If API returns duplicates (same student_id + student_planning_id), keep latest by updated_at. See PRESENCE_SINGLE_SOURCE_OF_TRUTH.md for backend contract. */
  const planPresences = useMemo(() => {
    if (!selectedPlanningId) return [];
    const planningId = Number(selectedPlanningId);
    const filtered = presences.filter((presence) => presence.student_planning_id === planningId);
    const map = new Map<number | string, StudentPresence>();

    const getTimestamp = (presence: StudentPresence) => {
      const dateString = presence.updated_at ?? presence.created_at ?? '';
      const ts = Date.parse(dateString);
      return Number.isNaN(ts) ? 0 : ts;
    };

    filtered.forEach((presence) => {
      const key = presence.student_id ?? `presence-${presence.id}`;
      const existing = map.get(key);
      if (!existing || getTimestamp(presence) >= getTimestamp(existing)) {
        map.set(key, presence);
      }
    });

    return Array.from(map.values());
  }, [presences, selectedPlanningId]);

  const compareByName = useCallback(
    (a: StudentPresence, b: StudentPresence) => {
      const nameA = formatStudentName(a, classStudentMap.get(a.student_id ?? 0), t).toLowerCase();
      const nameB = formatStudentName(b, classStudentMap.get(b.student_id ?? 0), t).toLowerCase();
      return nameA.localeCompare(nameB);
    },
    [classStudentMap, t]
  );

  // Split presences in single pass for better performance
  const { absentPresences, presentPresences } = useMemo(() => {
    const absent: typeof planPresences = [];
    const present: typeof planPresences = [];
    
    for (const presence of planPresences) {
      if (presence.presence === 'present') {
        present.push(presence);
      } else {
        absent.push(presence);
      }
    }
    
    return {
      absentPresences: absent.sort(compareByName),
      presentPresences: present.sort(compareByName),
    };
  }, [planPresences, compareByName]);

  /** Present students with note > -1 only (for Notes PDF). Memoized to avoid recomputing PDF payload. */
  const presentWithGradedNotes = useMemo(
    () =>
      presentPresences.filter(
        (p) => p.note != null && p.note > -1
      ),
    [presentPresences]
  );

  /** Teacher = teacher interface (teacherId passed). Controller = anywhere else (dashboard). No JWT role needed. */
  const isTeacher = teacherId != null && teacherId !== undefined;
  const isController = !isTeacher;

  const presenceValidationStatus: ValidationStatus =
    selectedPlanning ? getPresenceValidationStatus(selectedPlanning) : VALIDATION_DRAFT;
  const notesValidationStatus: ValidationStatus =
    selectedPlanning ? getNotesValidationStatus(selectedPlanning) : VALIDATION_DRAFT;

  const updatePlanningMut = useUpdatePlanningStudent();

  const createPresenceMut = useCreateStudentPresence();
  const updatePresenceMut = useUpdateStudentPresence();

  const autoCreatedRef = useRef<Set<string>>(new Set());
  const isCreatingRef = useRef(false);

  useEffect(() => {
    autoCreatedRef.current.clear();
    isCreatingRef.current = false;
  }, [selectedPlanningId]);

  useEffect(() => {
    if (!selectedPlanningId || !selectedPlanning?.class_id || classStudents.length === 0) {
      return;
    }

    if (isCreatingRef.current) {
      return;
    }

    const planningId = Number(selectedPlanningId);
    const createKey = (studentId: number) => `${planningId}-${studentId}`;
    
    const existingKeys = new Set<string>();
    planPresences.forEach((presence) => {
      if (presence.student_id && presence.student_planning_id) {
        existingKeys.add(`${presence.student_planning_id}-${presence.student_id}`);
      }
    });

    const missingStudentIds = classStudents
      .map((assignment) => assignment.student_id)
      .filter((studentId): studentId is number => Boolean(studentId))
      .filter((studentId) => {
        const key = createKey(studentId);
        return !existingKeys.has(key) && !autoCreatedRef.current.has(key);
      });

    if (!missingStudentIds.length) return;

    isCreatingRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        for (const studentId of missingStudentIds) {
          if (cancelled) break;
          const key = createKey(studentId);
          if (autoCreatedRef.current.has(key)) continue;
          autoCreatedRef.current.add(key);
          
          try {
            await createPresenceMut.mutateAsync({
              student_planning_id: planningId,
              student_id: studentId,
              presence: 'absent',
              note: -1,
              remarks: undefined,
              status: 1 as StudentPresenceStatus,
            });
          } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            const message = error?.response?.data?.message || '';
            if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('already exists')) {
              console.warn(`Presence already exists for student ${studentId} and planning ${planningId}`);
            } else {
              console.error('Failed to auto-create presence', err);
              autoCreatedRef.current.delete(key);
            }
          }
        }
      } finally {
        if (!cancelled) {
          isCreatingRef.current = false;
          refetchPresences();
        }
      }
    })();

    return () => {
      cancelled = true;
      isCreatingRef.current = false;
    };
  }, [
    classStudents,
    planPresences,
    selectedPlanningId,
    selectedPlanning,
    createPresenceMut,
    refetchPresences,
  ]);

  const handlePlanningSelect = (value: number | string | '') => {
    const strValue = value === '' ? '' : String(value);
    setSelectedPlanningId(strValue);
    setNoteEditor({ presence: null, note: '-1', remarks: '' });
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (strValue) next.set('planning', strValue);
      else next.delete('planning');
      return next;
    }, { replace: true });
  };

  const addToast = (type: ToastType, message: string, undoAction?: () => void) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, undoAction }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const handleMarkPresence = async (presence: StudentPresence, nextPresence: StudentPresence['presence']) => {
    const previousStatus = presence.presence;
    try {
      await updatePresenceMut.mutateAsync({
        id: presence.id,
        data: { presence: nextPresence },
      });
      
      const studentName = formatStudentName(presence, undefined, t);
      const statusLabel = presenceLabel[nextPresence];
      
      addToast(
        'success',
        t('forms.markedAs', { name: studentName, status: statusLabel }),
        () => {
          handleMarkPresence(presence, previousStatus as StudentPresence['presence']);
        }
      );
      
      refetchPresences();
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err, t));
    }
  };

  const openNoteEditor = (presence: StudentPresence) => {
    if (presence.presence !== 'present') return;
    setNoteEditor({
      presence,
      note: presence.note === null || presence.note === undefined ? '-1' : String(presence.note),
      remarks: presence.remarks ?? '',
    });
  };

  const closeNoteEditor = () => setNoteEditor({ presence: null, note: '-1', remarks: '' });

  const handleSaveNote = async () => {
    if (!noteEditor.presence) return;
    try {
      await updatePresenceMut.mutateAsync({
        id: noteEditor.presence.id,
        data: {
          note: Number(noteEditor.note ?? -1),
          remarks: noteEditor.remarks || undefined,
        },
      });
      addToast('success', t('forms.presenceUpdatedSuccessfully'));
      closeNoteEditor();
      refetchPresences();
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err, t));
    }
  };

  const handleGeneratePdf = async () => {
    if (!selectedPlanning || !planningDetail) {
      addToast('error', t('forms.pdfSessionIncomplete'));
      return;
    }
    setIsGeneratingPdf(true);
    try {
      const absentNames = absentPresences.map((p) =>
        formatStudentName(p, classStudentMap.get(p.student_id ?? 0), t)
      );
      const presentNames = presentPresences.map((p) =>
        formatStudentName(p, classStudentMap.get(p.student_id ?? 0), t)
      );
      const presencePdfValidatedLabel = isLocked(presenceValidationStatus)
        ? t('forms.finalControllerValidated')
        : isTeacherValidated(presenceValidationStatus)
          ? t('forms.teacherValidated')
          : null;
      await exportPresencePdf({
        header: {
          date: planningDetail.date,
          classGroup: planningDetail.classTitle,
          teacher: planningDetail.teacher,
          subject: planningDetail.sessionType,
          time: planningDetail.time,
          sessionCode: selectedPlanning.period ? `${t('forms.periodNumber')}${selectedPlanning.period}` : undefined,
          room: planningDetail.classroom,
        },
        absentNames,
        presentNames,
        validatedLabel: presencePdfValidatedLabel,
        labels: {
          absent: t('sections.absent'),
          present: t('sections.present'),
          teacherSignature: t('forms.signatureTeacher'),
          controllerSignature: t('forms.signatureController'),
        },
      });
      addToast('success', t('common.success') ?? 'PDF generated.');
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err, t));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateNotesPdf = async () => {
    if (!selectedPlanning || !planningDetail) {
      addToast('error', t('forms.pdfSessionIncomplete'));
      return;
    }
    setIsGeneratingNotesPdf(true);
    try {
      const absentNames = absentPresences.map((p) =>
        formatStudentName(p, classStudentMap.get(p.student_id ?? 0), t)
      );
      const presentGraded = presentWithGradedNotes.map((p) => ({
        name: formatStudentName(p, classStudentMap.get(p.student_id ?? 0), t),
        note: p.note ?? 0,
      }));
      const notesPdfValidatedLabel = isLocked(notesValidationStatus)
        ? t('forms.finalControllerValidated')
        : isTeacherValidated(notesValidationStatus)
          ? t('forms.teacherValidated')
          : null;
      await exportNotesPdf({
        header: {
          date: planningDetail.date,
          classGroup: planningDetail.classTitle,
          teacher: planningDetail.teacher,
          subject: planningDetail.sessionType,
          time: planningDetail.time,
          sessionCode: selectedPlanning.period ? `${t('forms.periodNumber')}${selectedPlanning.period}` : undefined,
          room: planningDetail.classroom,
        },
        absentNames,
        presentGraded,
        validatedLabel: notesPdfValidatedLabel,
        labels: {
          absent: t('sections.absent'),
          presentGraded: t('forms.presentGraded'),
          noteLabel: t('forms.notesPdfTitle'),
          teacherSignature: t('forms.signatureTeacher'),
          controllerSignature: t('forms.signatureController'),
        },
      });
      addToast('success', t('common.success') ?? 'Notes PDF generated.');
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err, t));
    } finally {
      setIsGeneratingNotesPdf(false);
    }
  };

  const handleConfirmValidation = async () => {
    if (!selectedPlanning || !confirmValidation) return;
    const isPresenceTeacher = confirmValidation === 'presence_teacher';
    const isPresenceController = confirmValidation === 'presence_controller';
    const isNotesTeacher = confirmValidation === 'notes_teacher';
    const isNotesController = confirmValidation === 'notes_controller';
    const payload =
      isPresenceTeacher
        ? { presence_validated_teacher: true, status: PLANNING_STATUS_ACTIVATED }
        : isPresenceController
          ? { presence_validated_controleur: true }
          : isNotesTeacher
            ? { notes_validated_teacher: true }
            : isNotesController
              ? { notes_validated_controleur: true }
              : {};
    try {
      await updatePlanningMut.mutateAsync({
        id: selectedPlanning.id,
        data: payload,
      });
      setConfirmValidation(null);
      closeNoteEditor();
      addToast('success', t('forms.validationSaved') ?? 'Validation saved.');
    } catch (err: unknown) {
      addToast('error', extractErrorMessage(err, t));
    }
  };

  const validationModalTitle =
    confirmValidation === 'presence_teacher'
      ? t('forms.activatePresence')
      : confirmValidation === 'presence_controller'
        ? t('forms.validatePresenceFinal')
        : confirmValidation === 'notes_teacher'
          ? t('forms.validateNotes')
          : confirmValidation === 'notes_controller'
            ? t('forms.validateNotesFinal')
            : '';
  const validationModalMessage =
    confirmValidation === 'presence_teacher'
      ? t('forms.confirmActivation')
      : confirmValidation === 'notes_teacher'
        ? t('forms.confirmTeacherValidation')
        : confirmValidation === 'presence_controller' || confirmValidation === 'notes_controller'
          ? t('forms.confirmControllerValidation')
          : '';

  const planningDetail = formatPlanningDetail(selectedPlanning ?? undefined, t);

  const overviewPlanning = useMemo(
    () => (overviewPlanningId ? (planningResp?.data || []).find((p) => p.id === overviewPlanningId) ?? null : null),
    [overviewPlanningId, planningResp?.data]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>, index: number, total: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = index < total - 1 ? index + 1 : 0;
      studentCardRefs.current.get(nextIndex)?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = index > 0 ? index - 1 : total - 1;
      studentCardRefs.current.get(prevIndex)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const card = studentCardRefs.current.get(index);
      const button = card?.querySelector('button[data-action]') as HTMLButtonElement;
      button?.click();
    }
  };

  const renderStudentCard = (
    presence: StudentPresence,
    index: number,
    total: number,
    side: 'present' | 'absent'
  ) => {
    const studentInfo = classStudentMap.get(presence.student_id ?? 0);
    const studentName = formatStudentName(presence, studentInfo, t);
    const pictureUrl = studentInfo?.student?.picture
      ? getFileUrl(studentInfo.student.picture)
      : null;
    const status = presence.presence || 'not-marked';
    const statusConfig = presenceStyles[status] || presenceStyles['not-marked'];
    const StatusIcon = getPresenceIcon(status);
    const isPresent = side === 'present';
    const canTogglePresence = viewMode === 'presence' && isEditable(presenceValidationStatus);
    const canEditNote = viewMode === 'notes' && isPresent && isEditable(notesValidationStatus);
    const dataLocked =
      (viewMode === 'presence' && !isEditable(presenceValidationStatus)) ||
      (viewMode === 'notes' && isPresent && !isEditable(notesValidationStatus));

    return (
      <div
        key={presence.id}
        ref={(el) => {
          if (el) studentCardRefs.current.set(index, el);
        }}
        tabIndex={canEditNote || canTogglePresence ? 0 : -1}
        onKeyDown={canEditNote || canTogglePresence ? (e) => handleKeyDown(e, index, total) : undefined}
        className={`group rounded-lg border p-4 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          dataLocked ? 'opacity-90' : 'hover:shadow-md hover:scale-[1.01]'
        } ${isPresent ? statusConfig.bg : 'bg-white'} ${statusConfig.border}`}
      >
        <div className="flex items-center gap-3">
          <Avatar name={studentName} size="lg" src={pictureUrl} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{studentName}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusConfig.icon}`} />
              <span className={`text-xs font-medium ${statusConfig.text}`}>
                {presenceLabel[status] || status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StudentDetailsButton studentId={presence.student_id ?? undefined} variant="info" />
            {canTogglePresence && (
              <button
                type="button"
                data-action="toggle"
                onClick={() => handleMarkPresence(presence, isPresent ? 'absent' : 'present')}
                disabled={updatePresenceMut.isPending}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  isPresent
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {updatePresenceMut.isPending ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : isPresent ? (
                  t('forms.markAbsent')
                ) : (
                  t('forms.markPresent')
                )}
              </button>
            )}
            {canEditNote && (
              <button
                type="button"
                onClick={() => openNoteEditor(presence)}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                aria-label={t('forms.addNote')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const headerMiddle = (
    <div className="flex flex-wrap items-end gap-2 justify-center w-full">
      <div className="min-w-[140px]">
        <label className="block text-sm font-medium text-body mb-0.5">{t('forms.planningDate')}</label>
        <input
          type="date"
          value={planningDate}
          onChange={(event) => {
            setPlanningDate(event.target.value);
            setSelectedPlanningId('');
            setNoteEditor({ presence: null, note: '-1', remarks: '' });
          }}
          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );

  const titleKey = viewMode === 'notes' ? 'pages.studentNotesTitle' : 'pages.studentPresenceTitle';
  const descriptionKey = viewMode === 'notes' ? 'pages.studentNotesDescription' : 'pages.studentPresenceDescription';

  return (
    <div className="flex flex-col min-h-0">
      <div className="space-y-6 flex-1">
      {/* Header: title | filters (no switcher; viewMode is set by route) */}
      <PageHeader
        titleKey={titleKey}
        descriptionKey={descriptionKey}
        icon={<ClipboardCheck className="w-5 h-5" />}
        middle={headerMiddle}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left - Planning sessions for selected date */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">{t('forms.planningSessionsForDate')}</h3>
          </div>
          <div className="p-3 max-h-[70vh] overflow-y-auto">
            {planningLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="animate-pulse h-14 bg-gray-200 rounded-lg" />
                ))}
              </div>
            ) : filteredPlannings.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                {planningDate ? t('forms.noPlanningOnThisDate') : t('forms.selectDateFirst')}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlannings.map((planning) => {
                  const stripSeconds = (s: string | undefined) =>
                    s && s.length >= 5 ? s.slice(0, 5) : s || '';
                  const start = stripSeconds(planning.hour_start);
                  const end = stripSeconds(planning.hour_end);
                  const timeRange = start && end ? `${start} – ${end}` : '';
                  const classLabel = planning.class?.title || (planning.class_id ? `${t('planning.classNumber')}${planning.class_id}` : null);
                  const courseLabel = planning.course?.title || (planning.course_id ? `${t('planning.courseNumber')}${planning.course_id}` : null);
                  const labelParts = [classLabel, courseLabel, timeRange].filter(Boolean);
                  const label = labelParts.length ? labelParts.join(' • ') : `${t('planning.planningNumber')}${planning.id}`;
                  const isSelected = selectedPlanningId === String(planning.id);
                  return (
                    <div
                      key={planning.id}
                      className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2.5 text-sm transition ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handlePlanningSelect(planning.id)}
                        className="flex-1 text-left min-w-0 truncate"
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOverviewPlanningId(planning.id);
                        }}
                        className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-primary hover:bg-primary/10 transition"
                        aria-label={t('forms.sessionOverview')}
                        title={t('forms.sessionOverview')}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right - Student lists when a session is selected */}
        <div className="min-w-0">
          {selectedPlanningId && planningDetail ? (
            <div className="space-y-6">
                {viewMode === 'presence' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200 bg-red-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              {t('forms.absentNotYetMarked')}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {absentPresences.length} {absentPresences.length === 1 ? t('common.student') : t('common.student') + 's'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 max-h-[600px] overflow-y-auto">
                        {presenceLoading || classStudentsLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-200 rounded-lg" />
                              </div>
                            ))}
                          </div>
                        ) : absentPresences.length === 0 ? (
                          <div className="py-12 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">{t('forms.noStudentsMarkedAbsent')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {absentPresences.map((presence, index) =>
                              renderStudentCard(presence, index, absentPresences.length, 'absent')
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200 bg-green-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              {t('forms.presentStudents')}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1">
                              {presentPresences.length} {presentPresences.length === 1 ? t('common.student') : t('common.student') + 's'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 max-h-[600px] overflow-y-auto">
                        {presenceLoading || classStudentsLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-200 rounded-lg" />
                              </div>
                            ))}
                          </div>
                        ) : presentPresences.length === 0 ? (
                          <div className="py-12 text-center">
                            <Circle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">{t('forms.noStudentsMarkedPresent')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {presentPresences.map((presence, index) =>
                              renderStudentCard(presence, index, presentPresences.length, 'present')
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'notes' && !hasNotes ? (
                  <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 text-center">
                    <p className="text-gray-600 font-medium">{t('forms.notesNotAvailableForSession')}</p>
                    <p className="text-sm text-gray-500 mt-2">{t('forms.notesNotAvailableDescription')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200 bg-red-50/50">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-600" />
                            {t('sections.absent')}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {t('forms.notesAbsentVisibilityOnly')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {absentPresences.length} {absentPresences.length === 1 ? t('common.student') : t('common.student') + 's'}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 max-h-[600px] overflow-y-auto">
                        {presenceLoading || classStudentsLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-200 rounded-lg" />
                              </div>
                            ))}
                          </div>
                        ) : absentPresences.length === 0 ? (
                          <div className="py-12 text-center">
                            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">{t('forms.noStudentsMarkedAbsent')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {absentPresences.map((presence, index) =>
                              renderStudentCard(presence, index, absentPresences.length, 'absent')
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="p-4 border-b border-gray-200 bg-green-50/50">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {t('forms.presentStudents')} · {t('common.notes')}
                          </h3>
                          <p className="text-xs text-gray-600 mt-1">
                            {t('forms.notesPresentGradedOnly')}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {presentPresences.length} {presentPresences.length === 1 ? t('common.student') : t('common.student') + 's'}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 max-h-[600px] overflow-y-auto">
                        {presenceLoading || classStudentsLoading ? (
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-200 rounded-lg" />
                              </div>
                            ))}
                          </div>
                        ) : presentPresences.length === 0 ? (
                          <div className="py-12 text-center">
                            <Circle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">{t('forms.markStudentsAsPresentToManage')}</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {presentPresences.map((presence, index) =>
                              renderStudentCard(presence, index, presentPresences.length, 'present')
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600">{t('forms.selectSessionFromList')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {presenceError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(presenceError as Error).message}
        </div>
      )}
      {classStudentsError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {(classStudentsError as Error).message}
        </div>
      )}
      </div>

      <PresenceFooterActions
        viewMode={viewMode}
        presenceValidationStatus={presenceValidationStatus}
        notesValidationStatus={notesValidationStatus}
        isTeacher={isTeacher}
        isController={isController}
        hasSession={!!selectedPlanningId}
        hasNotes={hasNotes}
        onGeneratePdf={handleGeneratePdf}
        onGenerateNotesPdf={handleGenerateNotesPdf}
        onActivatePresence={() => setConfirmValidation('presence_teacher')}
        onValidatePresenceController={() => setConfirmValidation('presence_controller')}
        onValidateNotesTeacher={() => setConfirmValidation('notes_teacher')}
        onValidateNotesController={() => setConfirmValidation('notes_controller')}
        isValidating={updatePlanningMut.isPending}
        isGeneratingPdf={isGeneratingPdf}
        isGeneratingNotesPdf={isGeneratingNotesPdf}
        canValidatePresence={presentPresences.length > 0}
        canValidateNotes={presentPresences.length > 0}
        sessionFullyActivated={selectedPlanning ? isSessionFullyActivated(selectedPlanning) : false}
      />

      <ValidationConfirmationModal
        isOpen={confirmValidation !== null}
        title={validationModalTitle}
        message={validationModalMessage}
        onConfirm={handleConfirmValidation}
        onCancel={() => setConfirmValidation(null)}
        isPending={updatePlanningMut.isPending}
      />

      <SessionOverviewModal
        planning={overviewPlanning}
        isOpen={!!overviewPlanningId}
        onClose={() => setOverviewPlanningId(null)}
      />

      {/* Note Editor Modal */}
      {noteEditor.presence && (
        <BaseModal
          isOpen
          onClose={closeNoteEditor}
          title={`${t('forms.updateNote')} · ${formatStudentName(noteEditor.presence ?? undefined, classStudentMap.get(noteEditor.presence?.student_id ?? 0), t)}`}
          className="sm:max-w-lg"
        >
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              handleSaveNote();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
              <input
                type="number"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                value={noteEditor.note}
                onChange={(event) => setNoteEditor((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="-1"
              />
              <p className="mt-1 text-xs text-gray-500">{t('forms.useMinusOneToIndicate')}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('forms.remarks')}</label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                value={noteEditor.remarks}
                onChange={(event) => setNoteEditor((prev) => ({ ...prev, remarks: event.target.value }))}
                placeholder={t('forms.addOptionalRemarks')}
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={closeNoteEditor}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </BaseModal>
      )}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

export default StudentPresenceSection;
