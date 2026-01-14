import React, { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, Building2, BookOpen, CheckCircle2, XCircle, Circle, AlertCircle } from 'lucide-react';
import type { StudentPresence } from '../../api/studentPresence';
import type { ClassStudentAssignment } from '../../api/classStudent';
import type { StudentPresenceStatus } from '../../api/studentPresence';
import {
  useStudentPresences,
  useCreateStudentPresence,
  useUpdateStudentPresence,
} from '../../hooks/useStudentPresence';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import { useClassStudents } from '../../hooks/useClassStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import BaseModal from '../modals/BaseModal';
import Avatar from '../ui/Avatar';
import { ToastContainer, type ToastType } from '../ui/Toast';
import type { PlanningStudentEntry } from '../../api/planningStudent';
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

const formatPlanningDetail = (planning: PlanningStudentEntry | undefined, t: (key: string) => string) => {
  if (!planning) return null;
  const date =
    planning.date_day && !Number.isNaN(new Date(planning.date_day).getTime())
      ? new Date(planning.date_day).toLocaleDateString()
      : '—';
  const time =
    planning.hour_start && planning.hour_end ? `${planning.hour_start} – ${planning.hour_end}` : '—';
  const teacher = planning.teacher
    ? `${planning.teacher.first_name ?? ''} ${planning.teacher.last_name ?? ''}`.trim() ||
      planning.teacher.email ||
      `${t('planning.teacherNumber')}${planning.teacher.id}`
    : '—';
  const classroom = planning.classRoom?.title || `${t('planning.roomNumber')}${planning.class_room_id ?? '—'}`;
  const classTitle = planning.class?.title || `${t('planning.classNumber')}${planning.class_id ?? '—'}`;
  return {
    date,
    time,
    teacher,
    classroom,
    classTitle,
    period: planning.period ?? '—',
  };
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

const StudentPresenceSection: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPlanningId, setSelectedPlanningId] = useState<string>('');
  const [planningDate, setPlanningDate] = useState('');
  const [activeTab, setActiveTab] = useState<'presence' | 'notes'>('presence');
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

  const { data: planningResp, isLoading: planningLoading } = usePlanningStudents({ page: 1, limit: 100 });

  const filteredPlannings = useMemo(() => {
    const all = planningResp?.data || [];
    if (!planningDate) return all;
    return all.filter((planning) => planning.date_day && planning.date_day.startsWith(planningDate));
  }, [planningResp, planningDate]);

  const planningOptions = useMemo<SearchSelectOption[]>(() => {
    return filteredPlannings.map((planning) => {
      const date = planning.date_day ? new Date(planning.date_day).toLocaleDateString() : '';
      const timeRange =
        planning.hour_start && planning.hour_end ? `${planning.hour_start} – ${planning.hour_end}` : '';
      const classLabel = planning.class?.title || (planning.class_id ? `${t('planning.classNumber')}${planning.class_id}` : null);
      const labelParts = [classLabel, planning.period, date, timeRange].filter(Boolean);
      return {
        value: planning.id,
        label: labelParts.length ? labelParts.join(' • ') : `${t('planning.planningNumber')}${planning.id}`,
      };
    });
  }, [filteredPlannings, t]);

  useEffect(() => {
    if (!selectedPlanningId) return;
    const exists = filteredPlannings.some((planning) => planning.id === Number(selectedPlanningId));
    if (!exists) {
      setSelectedPlanningId('');
      setNoteEditor({ presence: null, note: '-1', remarks: '' });
    }
  }, [filteredPlannings, selectedPlanningId]);

  const selectedPlanning = useMemo(
    () =>
      selectedPlanningId
        ? (planningResp?.data || []).find((planning) => planning.id === Number(selectedPlanningId))
        : null,
    [planningResp, selectedPlanningId]
  );

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

  const absentPresences = useMemo(() => {
    return planPresences
      .filter((presence) => presence.presence !== 'present')
      .sort(compareByName);
  }, [planPresences, compareByName]);

  const presentPresences = useMemo(() => {
    return planPresences
      .filter((presence) => presence.presence === 'present')
      .sort(compareByName);
  }, [planPresences, compareByName]);

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

  const planningDetail = formatPlanningDetail(selectedPlanning ?? undefined, t);
  const courseCoefficient = useMemo(() => {
    if (!selectedPlanning?.course) return '—';
    const course = selectedPlanning.course as { coefficient?: number | string };
    return course.coefficient ?? '—';
  }, [selectedPlanning]);


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
    const status = presence.presence || 'not-marked';
    const statusConfig = presenceStyles[status] || presenceStyles['not-marked'];
    const StatusIcon = getPresenceIcon(status);
    const isPresent = side === 'present';

    return (
      <div
        key={presence.id}
        ref={(el) => {
          if (el) studentCardRefs.current.set(index, el);
        }}
        tabIndex={0}
        onKeyDown={(e) => handleKeyDown(e, index, total)}
        className={`group rounded-lg border p-4 shadow-sm transition-all hover:shadow-md hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          isPresent ? statusConfig.bg : 'bg-white'
        } ${statusConfig.border}`}
      >
        <div className="flex items-center gap-3">
          <Avatar name={studentName} size="md" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{studentName}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusIcon className={`w-4 h-4 ${statusConfig.icon}`} />
              <span className={`text-xs font-medium ${statusConfig.text}`}>
                {presenceLabel[status] || status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
              <span>Note: {presence.note ?? -1}</span>
              {presence.remarks && (
                <button
                  type="button"
                  onClick={() => openNoteEditor(presence)}
                  className="text-primary hover:underline"
                >
                  {t('forms.viewRemarks')}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'presence' && (
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
            {activeTab === 'notes' && isPresent && (
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        titleKey="pages.studentPresenceTitle"
        descriptionKey="pages.studentPresenceDescription"
        icon={<ClipboardCheck className="w-5 h-5" />}
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
          {(['presence', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-semibold rounded-full transition ${
                activeTab === tab
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab === 'presence' ? t('sections.present') : t('common.notes')}
            </button>
          ))}
        </div>
      </div>

      {/* Planning Selector - Combined */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('forms.planningSession')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">{t('forms.planningDate')}</label>
            <input
              type="date"
              value={planningDate}
              onChange={(event) => {
                setPlanningDate(event.target.value);
                setSelectedPlanningId('');
                setNoteEditor({ presence: null, note: '-1', remarks: '' });
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <SearchSelect
            label={t('forms.selectedSession')}
            value={selectedPlanningId}
            onChange={handlePlanningSelect}
            options={planningOptions}
            placeholder={
              planningDate
                ? planningOptions.length
                  ? t('forms.selectPlanning')
                  : t('forms.noPlanningOnThisDate')
                : t('forms.selectDateFirst')
            }
            isLoading={planningLoading}
            disabled={!planningDate || planningOptions.length === 0}
          />
        </div>
      </div>

      {selectedPlanningId && planningDetail ? (
        <div className="grid grid-cols-1 lg:grid-cols-[65%_35%] gap-6">
          {/* Left Column - Student Lists (65%) */}
          <div className="space-y-6">
            {activeTab === 'presence' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Absent / Not Marked Column */}
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

                {/* Present Column */}
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
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t('forms.presentStudents')} · {t('common.notes')}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {presentPresences.length} {presentPresences.length === 1 ? t('common.student') : t('common.student') + 's'}
                  </p>
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
            )}
          </div>

          {/* Right Column - Session Summary (35% - Sticky) */}
          <div className="lg:sticky lg:top-4 h-fit">
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {t('forms.sessionOverview')}
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t('common.date')}</p>
                    <p className="text-sm font-medium text-gray-900">{planningDetail.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t('common.time')}</p>
                    <p className="text-sm font-medium text-gray-900">{planningDetail.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t('sections.teacher')}</p>
                    <p className="text-sm font-medium text-gray-900">{planningDetail.teacher}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t('forms.classroom')}</p>
                    <p className="text-sm font-medium text-gray-900">{planningDetail.classroom}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">{t('sidebar.classes')}</p>
                    <p className="text-sm font-medium text-gray-900">{planningDetail.classTitle}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('sections.period')}: {planningDetail.period}</p>
                  </div>
                </div>
                {activeTab === 'notes' && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">{t('sections.coefficient')}</p>
                    <p className="text-2xl font-semibold text-primary">{courseCoefficient}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm text-gray-600">
            {planningDate
              ? planningOptions.length
                ? t('forms.selectPlanningSessionToLoad')
                : t('forms.noPlanningSessionsFound')
              : t('forms.selectDateToView')}
          </p>
        </div>
      )}

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

      {/* Note Editor Modal */}
      {noteEditor.presence && (
        <BaseModal
          isOpen
          onClose={closeNoteEditor}
          title={`${t('forms.updateNote')} · ${formatStudentName(noteEditor.presence, classStudentMap.get(noteEditor.presence.student_id ?? 0), t)}`}
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
