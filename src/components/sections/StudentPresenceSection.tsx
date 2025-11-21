import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const formatStudentName = (
  presence: StudentPresence | undefined,
  classStudent?: ClassStudentAssignment
) => {
  const student = presence?.student ?? classStudent?.student;
  const first = student?.first_name ?? '';
  const last = student?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || student?.email || `Student #${student?.id ?? presence?.student_id ?? classStudent?.student_id ?? '—'}`;
};

const formatPlanningDetail = (planning: PlanningStudentEntry | undefined) => {
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
      `Teacher #${planning.teacher.id}`
    : '—';
  const classroom = planning.class_room?.title || `Room #${planning.class_room_id ?? '—'}`;
  const classTitle = planning.class?.title || `Class #${planning.class_id ?? '—'}`;
  return {
    date,
    time,
    teacher,
    classroom,
    classTitle,
    period: planning.period ?? '—',
  };
};

const presenceLabel: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

const presenceStyles: Record<string, string> = {
  present: 'border-green-200 bg-green-50 text-green-800',
  absent: 'border-red-200 bg-red-50 text-red-700',
  late: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  excused: 'border-purple-200 bg-purple-50 text-purple-800',
};

const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'Unexpected error';
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return 'Unexpected error';
};

const StudentPresenceSection: React.FC = () => {
  const [selectedPlanningId, setSelectedPlanningId] = useState<string>('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [planningDate, setPlanningDate] = useState('');
  const [activeTab, setActiveTab] = useState<'presence' | 'notes'>('presence');
  const [noteEditor, setNoteEditor] = useState<{
    presence: StudentPresence | null;
    note: string;
    remarks: string;
  }>({ presence: null, note: '-1', remarks: '' });

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
      const classLabel = planning.class?.title || (planning.class_id ? `Class #${planning.class_id}` : null);
      const labelParts = [classLabel, planning.period, date, timeRange].filter(Boolean);
      return {
        value: planning.id,
        label: labelParts.length ? labelParts.join(' • ') : `Planning #${planning.id}`,
      };
    });
  }, [filteredPlannings]);

  useEffect(() => {
    if (!selectedPlanningId) return;
    const exists = filteredPlannings.some((planning) => planning.id === Number(selectedPlanningId));
    if (!exists) {
      setSelectedPlanningId('');
      setAlert(null);
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
      const nameA = formatStudentName(a, classStudentMap.get(a.student_id ?? 0)).toLowerCase();
      const nameB = formatStudentName(b, classStudentMap.get(b.student_id ?? 0)).toLowerCase();
      return nameA.localeCompare(nameB);
    },
    [classStudentMap]
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

  const PAGE_SIZE = 10;
  const [absentPage, setAbsentPage] = useState(1);
  const [presentPage, setPresentPage] = useState(1);

  useEffect(() => {
    setAbsentPage(1);
    setPresentPage(1);
  }, [absentPresences.length, presentPresences.length]);

  const paginate = (list: StudentPresence[], page: number) => {
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return {
      slice: list.slice(start, end),
      page: safePage,
      totalPages,
      startIndex: start + 1,
      endIndex: Math.min(end, list.length),
    };
  };

  const absentPagination = paginate(absentPresences, absentPage);
  const presentPagination = paginate(presentPresences, presentPage);

  const createPresenceMut = useCreateStudentPresence();
  const updatePresenceMut = useUpdateStudentPresence();

  const autoCreatedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    autoCreatedRef.current.clear();
  }, [selectedPlanningId]);

  useEffect(() => {
    if (!selectedPlanningId || !selectedPlanning?.class_id || classStudents.length === 0) {
      return;
    }

    const planningId = Number(selectedPlanningId);
    const existingStudentIds = new Set(planPresences.map((presence) => presence.student_id));
    const missingStudentIds = classStudents
      .map((assignment) => assignment.student_id)
      .filter((studentId): studentId is number => Boolean(studentId))
      .filter((studentId) => !existingStudentIds.has(studentId))
      .filter((studentId) => !autoCreatedRef.current.has(studentId));

    if (!missingStudentIds.length) return;

    let cancelled = false;
    (async () => {
      for (const studentId of missingStudentIds) {
        autoCreatedRef.current.add(studentId);
        try {
          await createPresenceMut.mutateAsync({
            student_planning_id: planningId,
            student_id: studentId,
            presence: 'absent',
            note: -1,
            remarks: undefined,
            status: 1 as StudentPresenceStatus,
          });
        } catch (err) {
          console.error('Failed to auto-create presence', err);
        }
      }
      if (!cancelled) {
        refetchPresences();
      }
    })();

    return () => {
      cancelled = true;
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
    setAlert(null);
    setNoteEditor({ presence: null, note: '-1', remarks: '' });
  };

  const handleMarkPresence = async (presence: StudentPresence, nextPresence: StudentPresence['presence']) => {
    try {
      await updatePresenceMut.mutateAsync({
        id: presence.id,
        data: { presence: nextPresence },
      });
      setAlert({ type: 'success', message: `Marked ${formatStudentName(presence)} as ${presenceLabel[nextPresence]}` });
      refetchPresences();
    } catch (err: unknown) {
      setAlert({ type: 'error', message: extractErrorMessage(err) });
    }
  };

  const openNoteEditor = (presence: StudentPresence) => {
    setNoteEditor({
      presence,
      note:
        presence.note === null || presence.note === undefined ? '-1' : String(presence.note),
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
      setAlert({ type: 'success', message: 'Presence updated successfully.' });
      closeNoteEditor();
      refetchPresences();
    } catch (err: unknown) {
      setAlert({ type: 'error', message: extractErrorMessage(err) });
    }
  };

  const planningDetail = formatPlanningDetail(selectedPlanning);
  const courseCoefficient = useMemo(() => {
    if (!selectedPlanning?.course) return '—';
    const course = selectedPlanning.course as { coefficient?: number | string };
    return course.coefficient ?? '—';
  }, [selectedPlanning]);

  const renderPresenceItem = (
    presence: StudentPresence,
    side: 'left' | 'right',
    showEdit = false
  ) => {
    const studentInfo = classStudentMap.get(presence.student_id ?? 0);
    const chipStyle = presenceStyles[presence.presence] ?? 'border-gray-200 bg-gray-50 text-gray-600';
    const containerStyle =
      side === 'left'
        ? 'border-orange-200 bg-orange-50/80'
        : 'border-green-200 bg-green-50/80';
    const titleColor = side === 'left' ? 'text-orange-900' : 'text-green-900';
    const metaColor = side === 'left' ? 'text-orange-600' : 'text-green-600';
    return (
      <li
        key={presence.id}
        className={`rounded-2xl border p-4 shadow-sm flex items-start justify-between gap-3 ${containerStyle}`}
      >
        <div className="space-y-1">
          <p className={`font-semibold leading-tight ${titleColor}`}>{formatStudentName(presence, studentInfo)}</p>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${chipStyle}`}>
            {presenceLabel[presence.presence] ?? presence.presence}
          </span>
          <div className={`text-xs ${metaColor}`}>
            Note: {presence.note ?? -1} •{' '}
            {presence.remarks ? (
              <button
                type="button"
                className="text-inherit underline-offset-2 hover:underline"
                onClick={() =>
                  setNoteEditor({
                    presence,
                    note:
                      presence.note === null || presence.note === undefined
                        ? '-1'
                        : String(presence.note),
                    remarks: presence.remarks ?? '',
                  })
                }
              >
                View remarks
              </button>
            ) : (
              'No remarks'
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showEdit && (
            <button
              type="button"
              onClick={() => openNoteEditor(presence)}
              className={`rounded-full border p-2 ${
                side === 'left'
                  ? 'border-orange-300 text-orange-600 hover:text-orange-700 hover:border-orange-400'
                  : 'border-green-300 text-green-600 hover:text-green-700 hover:border-green-400'
              }`}
              aria-label="Edit note and remarks"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 3.732z" />
              </svg>
            </button>
          )}
          {side === 'left' ? (
            <button
              type="button"
              onClick={() => handleMarkPresence(presence, 'present')}
              className="rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600"
            >
              Mark present
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleMarkPresence(presence, 'absent')}
              className="rounded-full border border-green-600 px-3 py-1 text-xs font-semibold text-green-700 hover:bg-green-50"
            >
              Mark absent
            </button>
          )}
        </div>
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Student Presence</h1>
          <p className="text-sm text-gray-500">
            Select a planning session to mark students as present or absent and manage remarks.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
          {(['presence', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-full transition ${
                activeTab === tab
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'presence' ? 'Presence' : 'Notes'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Planning date</label>
          <input
            type="date"
            value={planningDate}
            onChange={(event) => {
              setPlanningDate(event.target.value);
              setSelectedPlanningId('');
              setAlert(null);
              setNoteEditor({ presence: null, note: '-1', remarks: '' });
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <SearchSelect
          label="Planning session"
          value={selectedPlanningId}
          onChange={handlePlanningSelect}
          options={planningOptions}
          placeholder={
            planningDate
              ? planningOptions.length
                ? 'Select planning'
                : 'No planning on this date'
              : 'Select a date first'
          }
          isLoading={planningLoading}
          disabled={!planningDate || planningOptions.length === 0}
        />

        {planningDetail && (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-blue-500 mb-2">Planning details</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-xs text-blue-500">Class</p>
                <p className="font-semibold">{planningDetail.classTitle}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Period</p>
                <p className="font-semibold">{planningDetail.period}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Date</p>
                <p className="font-semibold">{planningDetail.date}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Time</p>
                <p className="font-semibold">{planningDetail.time}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Teacher</p>
                <p className="font-semibold">{planningDetail.teacher}</p>
              </div>
              <div>
                <p className="text-xs text-blue-500">Classroom</p>
                <p className="font-semibold">{planningDetail.classroom}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {alert && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {alert.message}
        </div>
      )}

      {presenceError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(presenceError as Error).message}
        </div>
      )}
      {classStudentsError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(classStudentsError as Error).message}
        </div>
      )}

      {activeTab === 'presence' ? (
        !selectedPlanningId ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
            {planningDate
              ? planningOptions.length
                ? 'Select a planning session to load class roster and manage student presence.'
                : 'No planning sessions found for the selected date.'
              : 'Select a date to view available planning sessions.'}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Class roster · Absent / Not yet marked</p>
                  <p className="text-xs text-gray-500">
                    {absentPresences.length} student{absentPresences.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              {presenceLoading || classStudentsLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Loading students…</div>
              ) : absentPresences.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">Everyone is marked present.</div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {absentPagination.slice.map((presence) => renderPresenceItem(presence, 'left', false))}
                  </ul>
                  {absentPresences.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span>
                        Showing {absentPagination.startIndex}–{absentPagination.endIndex} of {absentPresences.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAbsentPage((prev) => Math.max(1, prev - 1))}
                          disabled={absentPagination.page === 1}
                          className="rounded-full border px-2 py-1 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span>
                          {absentPagination.page}/{absentPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setAbsentPage((prev) => Math.min(absentPagination.totalPages, prev + 1))}
                          disabled={absentPagination.page === absentPagination.totalPages}
                          className="rounded-full border px-2 py-1 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Present students</p>
                  <p className="text-xs text-gray-500">
                    {presentPresences.length} student{presentPresences.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              {presenceLoading || classStudentsLoading ? (
                <div className="py-12 text-center text-sm text-gray-500">Loading students…</div>
              ) : presentPresences.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">Mark students as present to see them here.</div>
              ) : (
                <>
                  <ul className="space-y-3">
                    {presentPagination.slice.map((presence) => renderPresenceItem(presence, 'right', false))}
                  </ul>
                  {presentPresences.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span>
                        Showing {presentPagination.startIndex}–{presentPagination.endIndex} of {presentPresences.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPresentPage((prev) => Math.max(1, prev - 1))}
                          disabled={presentPagination.page === 1}
                          className="rounded-full border px-2 py-1 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span>
                          {presentPagination.page}/{presentPagination.totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPresentPage((prev) => Math.min(presentPagination.totalPages, prev + 1))}
                          disabled={presentPagination.page === presentPagination.totalPages}
                          className="rounded-full border px-2 py-1 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )
      ) : !selectedPlanningId ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
          {planningDate
            ? planningOptions.length
              ? 'Select a planning session to review and edit notes.'
              : 'No planning sessions found for the selected date.'
            : 'Select a date to view available planning sessions.'}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 shadow-inner">
            <p className="text-xs uppercase tracking-wide text-sky-500 mb-1">Coefficient</p>
            <p className="text-2xl font-semibold">
              {courseCoefficient}
            </p>
          </div>
          <div className="space-y-3 rounded-2xl border border-green-100 bg-white p-4 shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">Present students · Notes</p>
                <p className="text-xs text-gray-500">
                  {presentPresences.length} student{presentPresences.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            {presenceLoading || classStudentsLoading ? (
              <div className="py-12 text-center text-sm text-gray-500">Loading students…</div>
            ) : presentPresences.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">Mark students as present to manage notes.</div>
            ) : (
              <>
                <ul className="space-y-3">
                  {presentPagination.slice.map((presence) => renderPresenceItem(presence, 'right', true))}
                </ul>
                {presentPresences.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <span>
                      Showing {presentPagination.startIndex}–{presentPagination.endIndex} of {presentPresences.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPresentPage((prev) => Math.max(1, prev - 1))}
                        disabled={presentPagination.page === 1}
                        className="rounded-full border px-2 py-1 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <span>
                        {presentPagination.page}/{presentPagination.totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPresentPage((prev) => Math.min(presentPagination.totalPages, prev + 1))}
                        disabled={presentPagination.page === presentPagination.totalPages}
                        className="rounded-full border px-2 py-1 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {noteEditor.presence && (
        <BaseModal
          isOpen
          onClose={closeNoteEditor}
          title={`Update note · ${formatStudentName(noteEditor.presence, classStudentMap.get(noteEditor.presence.student_id ?? 0))}`}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input
                type="number"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={noteEditor.note}
                onChange={(event) => setNoteEditor((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="-1"
              />
              <p className="mt-1 text-xs text-gray-500">Use -1 to indicate no note was provided.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                value={noteEditor.remarks}
                onChange={(event) => setNoteEditor((prev) => ({ ...prev, remarks: event.target.value }))}
                placeholder="Add optional remarks…"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeNoteEditor}
                className="text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </BaseModal>
      )}
    </div>
  );
};

export default StudentPresenceSection;

