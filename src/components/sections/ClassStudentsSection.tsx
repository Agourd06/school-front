import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import { useDeleteClassStudent, useCreateClassStudent } from '../../hooks/useClassStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { classStudentApi } from '../../api/classStudent';
import type { MinimalStudent, GetClassStudentParams } from '../../api/classStudent';
import type { Student as ApiStudent } from '../../api/students';
import type { DropResult } from '@hello-pangea/dnd';
import type { PaginatedResponse } from '../../types/api';
import type { SchoolYear } from '../../api/schoolYear';
import type { ClassEntity } from '../../api/classes';
import { STATUS_OPTIONS } from '../../constants/status';
import { studentsApi } from '../../api/students';
import BaseModal from '../modals/BaseModal';
import { getFileUrl } from '../../utils/apiConfig';
import { Info, UserPlus } from 'lucide-react';
import { PageHeader } from '../ui';

type StudentLite = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  status?: number | null;
};

type AssignedStudent = {
  assignmentId: number;
  student: StudentLite;
  tri: number;
  status: number;
  createdAt?: string;
};

const MAX_FETCH_LIMIT = 100;

const makeStudentLite = (fallbackId: number, student?: Partial<ApiStudent> | MinimalStudent | StudentLite | null): StudentLite => ({
  id: student?.id ?? fallbackId,
  first_name: student?.first_name ?? null,
  last_name: student?.last_name ?? null,
  email: student?.email ?? null,
  status: student?.status ?? null,
});

const getStudentLabel = (student: StudentLite, t: (key: string) => string) => {
  const fullName = `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim();
  return fullName || student.email || `${t('forms.studentNumber')}${student.id}`;
};

const sortStudentsByLabel = (a: StudentLite, b: StudentLite, t: (key: string) => string) => getStudentLabel(a, t).localeCompare(getStudentLabel(b, t));

const StudentDetailsButton: React.FC<{ studentId: number }> = ({ studentId }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState<{ src: string; label: string } | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ['studentDetails', studentId],
    queryFn: () => studentsApi.getDetails(studentId),
    enabled: isOpen && !!studentId,
    staleTime: 60_000,
  });

  const student = data?.student as ApiStudent | undefined;
  const diploma = data?.diploma;
  const contact = data?.contact;
  const linkType = data?.linkType ?? contact?.studentLinkType;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-full p-1.5 text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        title={t('common.view') + ' ' + t('common.details')}
      >
        <Info className="h-4 w-4" />
      </button>
      <BaseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={student ? `${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || t('forms.studentDetails') : t('forms.studentDetails')}
      >
        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-500">{t('forms.loadingStudentDetails')}</div>
        ) : error ? (
          <div className="py-2 text-sm text-red-600">
            {t('forms.failedToLoadStudentDetails')}
          </div>
        ) : (
          <div className="space-y-5">
            {student && (
              <section className="space-y-2">
                <div className="flex items-center gap-3">
                  {student.picture && (
                    <img
                      src={getFileUrl(student.picture)}
                      alt={student.first_name ?? student.email ?? 'student'}
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-base font-semibold text-gray-900">
                      {`${student.first_name ?? ''} ${student.last_name ?? ''}`.trim() || student.email || `#${student.id}`}
                    </p>
                    <p className="text-sm text-gray-500">{student.email}</p>
                    {student.phone && <p className="text-sm text-gray-500">{student.phone}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500 uppercase text-xs">{t('forms.nationality')}</p>
                    <p className="text-gray-900">{student.nationality || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">{t('forms.birthday')}</p>
                    <p className="text-gray-900">{student.birthday || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">{t('forms.city')}</p>
                    <p className="text-gray-900">{student.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 uppercase text-xs">{t('forms.country')}</p>
                    <p className="text-gray-900">{student.country || '—'}</p>
                  </div>
                </div>
              </section>
            )}

            {diploma && (
              <section className="rounded-2xl border border-gray-200 p-4 space-y-4 bg-gradient-to-br from-white to-blue-50/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-blue-500">{t('forms.academicRecord')}</p>
                    <h4 className="text-lg font-semibold text-gray-900 mt-1">{diploma.title || t('forms.diploma')}</h4>
                  </div>
                  <span className="text-xs rounded-full bg-blue-100 px-3 py-0.5 text-blue-700 font-semibold">
                    {diploma.status === 1 ? t('forms.active') : diploma.status === -1 ? t('forms.archived') : t('forms.draft')}
                  </span>
                </div>
                  <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-800">
                    <p><span className="text-gray-500">{t('forms.diploma')}:</span> {diploma.diplome || '—'}</p>
                    <p><span className="text-gray-500">{t('forms.school')}:</span> {diploma.school || '—'}</p>
                    <p><span className="text-gray-500">{t('forms.year')}:</span> {diploma.annee || '—'}</p>
                    <p><span className="text-gray-500">{t('common.status')}:</span> {diploma.status ?? '—'}</p>
                    <p className="sm:col-span-2">
                      <span className="text-gray-500">{t('forms.location')}:</span>{' '}
                      {[diploma.city, diploma.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(diploma.diplome_picture_1 || diploma.diplome_picture_2) ? (
                      // Precompute safe URLs
                      (() => {
                        const picture1Url = diploma.diplome_picture_1 ? getFileUrl(diploma.diplome_picture_1) : '';
                        const picture2Url = diploma.diplome_picture_2 ? getFileUrl(diploma.diplome_picture_2) : '';
                        return (
                          <>
                            {picture1Url && (
                              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreview({
                                      src: picture1Url,
                                      label: `${diploma.title || t('forms.diploma')} – ${t('forms.picture')} 1`,
                                    })
                                  }
                                  className="w-full h-48 flex items-center justify-center bg-gray-50"
                                >
                                  <img
                                    className="max-h-48 w-full object-contain transition-transform duration-300 hover:scale-105"
                                    src={picture1Url}
                                    alt={`${t('forms.diplomaPicture')} 1`}
                                    loading="lazy"
                                    decoding="async"
                                    width="400"
                                    height="192"
                                  />
                                </button>
                              </div>
                            )}
                            {picture2Url && (
                              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreview({
                                      src: picture2Url,
                                      label: `${diploma.title || t('forms.diploma')} – ${t('forms.picture')} 2`,
                                    })
                                  }
                                  className="w-full h-48 flex items-center justify-center bg-gray-50"
                                >
                                  <img
                                    className="max-h-48 w-full object-contain transition-transform duration-300 hover:scale-105"
                                    src={picture2Url}
                                    alt={`${t('forms.diplomaPicture')} 2`}
                                    loading="lazy"
                                    decoding="async"
                                    width="400"
                                    height="192"
                                  />
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()
                    ) : (
                      <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs text-gray-500">
                        {t('sections.noDiplomaImagesUploaded')}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {contact && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{t('sections.contact')}</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {contact.status === 1 ? t('forms.active') : contact.status === -1 ? t('sections.archived') : t('sections.draft')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
                  <p><span className="text-gray-500">{t('common.name')}:</span> {`${contact.firstname ?? ''} ${contact.lastname ?? ''}`.trim() || '—'}</p>
                  <p><span className="text-gray-500">{t('forms.birthday')}:</span> {contact.birthday || '—'}</p>
                  <p><span className="text-gray-500">{t('common.email')}:</span> {contact.email || '—'}</p>
                  <p><span className="text-gray-500">{t('common.phone')}:</span> {contact.phone || '—'}</p>
                  <p><span className="text-gray-500">{t('common.address')}:</span> {contact.adress || '—'}</p>
                  <p><span className="text-gray-500">{t('forms.city')}:</span> {contact.city || '—'}</p>
                  <p><span className="text-gray-500">{t('forms.country')}:</span> {contact.country || '—'}</p>
                </div>
              </section>
            )}

            {linkType && (
              <section className="rounded-lg border border-gray-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{t('sections.linkType')}</h4>
                  <span className="text-xs rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                    {linkType.status === 1 ? t('forms.active') : linkType.status === 0 ? t('sections.disabled') : t('sections.draft')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="text-gray-500">{t('common.name')}:</span> {linkType.title || '—'}
                </p>
                {linkType.student_id && (
                  <p className="text-xs text-gray-500">{t('sections.linkedStudentId')}: {linkType.student_id}</p>
                )}
              </section>
            )}

            {!student && !diploma && !contact && (
              <p className="text-sm text-gray-500">{t('sections.noDetailsAvailable')}</p>
            )}
          </div>
        )}
      </BaseModal>
      <BaseModal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        title={preview?.label || t('sections.diplomaPreview')}
      >
        {preview && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={preview.src}
              alt={preview.label}
              className="max-h-[75vh] w-full object-contain rounded-2xl border bg-white"
            />
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              {t('sections.closePreview')}
            </button>
          </div>
        )}
      </BaseModal>
    </>
  );
};

const ClassStudentsSection: React.FC = () => {
  const { t } = useTranslation();
  const [yearFilter, setYearFilter] = useState<number | ''>('');
  const [classFilter, setClassFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<number | ''>('');
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentLite[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<number | ''>('');
  const [unassignedFilter, setUnassignedFilter] = useState<number | ''>('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const createMut = useCreateClassStudent();
  const deleteMut = useDeleteClassStudent();

  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: MAX_FETCH_LIMIT });
  
  const studentsMap = useMemo(() => {
    const map = new Map<number, StudentLite>();
    ((studentsResp as PaginatedResponse<ApiStudent>)?.data || []).forEach((stu) => {
      map.set(stu.id, makeStudentLite(stu.id, stu));
    });
    return map;
  }, [studentsResp]);

  const assignedQuery = useQuery({
    queryKey: ['classStudents', 'byClass', classFilter || 'none', statusFilter || 'all'],
    queryFn: () => {
      const params: GetClassStudentParams = {
        class_id: Number(classFilter),
        limit: MAX_FETCH_LIMIT,
        status: statusFilter === '' ? undefined : Number(statusFilter),
      };
      return classStudentApi.getAll(params);
    },
    enabled: typeof classFilter === 'number' && classFilter > 0,
  });

  const allAssignmentsQuery = useQuery({
    queryKey: ['classStudents', 'all'],
    queryFn: () => classStudentApi.getAll({ page: 1, limit: MAX_FETCH_LIMIT }),
    enabled: !!classFilter,
  });

  useEffect(() => {
    if (!classFilter || !assignedQuery.data) {
      setAssignedStudents([]);
      return;
    }

    const assignments = assignedQuery.data?.data || [];
    const next = assignments
      .filter((item) => item.status !== -2 && item.student_id)
      .map((item) => {
        const fallback = studentsMap.get(item.student_id);
        return {
          assignmentId: item.id,
          student: makeStudentLite(item.student_id, item.student ?? fallback ?? { id: item.student_id }),
          tri: item.tri ?? 1,
          status: item.status,
          createdAt: item.created_at,
        } as AssignedStudent;
      })
      .sort((a, b) => (a.tri ?? 0) - (b.tri ?? 0));

    setAssignedStudents(next);
  }, [assignedQuery.data, classFilter, studentsMap]);

  useEffect(() => {
    if (!classFilter) return;
    const assignments = allAssignmentsQuery.data?.data || [];
    const assignedIds = new Set<number>();
    assignments.forEach((item) => {
      if (item.status !== -2 && item.student_id) {
        assignedIds.add(item.student_id);
      }
    });

    const students = ((studentsResp as PaginatedResponse<ApiStudent>)?.data || [])
      .filter((stu) => stu?.status !== -2)
      .filter((stu) => !assignedIds.has(stu.id))
      .map((stu) => makeStudentLite(stu.id, stu))
      .sort((a, b) => sortStudentsByLabel(a, b, t));

    setUnassignedStudents(students);
  }, [allAssignmentsQuery.data, studentsResp, classFilter, t]);

  const assignedFilterOptions: SearchSelectOption[] = useMemo(
    () =>
      assignedStudents.map((item) => ({
        value: item.student.id,
        label: getStudentLabel(item.student, t),
      })),
    [assignedStudents, t]
  );

  const unassignedFilterOptions: SearchSelectOption[] = useMemo(
    () =>
      unassignedStudents.map((item) => ({
        value: item.id,
        label: getStudentLabel(item, t),
      })),
    [unassignedStudents, t]
  );

  const assignedSearchLower = assignedSearch.trim().toLowerCase();
  const unassignedSearchLower = unassignedSearch.trim().toLowerCase();

  const filteredAssigned = useMemo(() => {
    return assignedStudents.filter((item) => {
      if (assignedFilter !== '' && item.student.id !== Number(assignedFilter)) return false;
      if (!assignedSearchLower) return true;
      return getStudentLabel(item.student, t).toLowerCase().includes(assignedSearchLower);
    });
  }, [assignedStudents, assignedFilter, assignedSearchLower, t]);

  const filteredUnassigned = useMemo(() => {
    return unassignedStudents.filter((item) => {
      if (unassignedFilter !== '' && item.id !== Number(unassignedFilter)) return false;
      if (!unassignedSearchLower) return true;
      return getStudentLabel(item, t).toLowerCase().includes(unassignedSearchLower);
    });
  }, [unassignedStudents, unassignedFilter, unassignedSearchLower, t]);

  const isMutationLoading = createMut.isPending || deleteMut.isPending || isAssigning || isRemoving;
  const isAssignedLoading = assignedQuery.isLoading || assignedQuery.isFetching;
  const isUnassignedLoading = studentsLoading || allAssignmentsQuery.isLoading;

  // Fetch school years - filter out completed, only allow planned and ongoing
  const { data: schoolYearsResp, isLoading: yearsLoading } = useSchoolYears({ page: 1, limit: 100 });
  const yearOptions: SearchSelectOption[] = useMemo(
    () => ((schoolYearsResp as PaginatedResponse<SchoolYear>)?.data || [])
      .filter((year) => year.lifecycle_status !== 'completed')
      .map((year) => ({ value: year.id, label: year.title || `${t('forms.yearNumber')}${year.id}` })),
    [schoolYearsResp, t]
  );

  // Fetch classes filtered by year
  const classesParams = useMemo(() => ({
    page: 1,
    limit: 100,
    school_year_id: yearFilter === '' || yearFilter === undefined || yearFilter === null ? undefined : Number(yearFilter),
  }), [yearFilter]);
  
  const { data: classesResp, isLoading: classesLoading } = useClasses(classesParams);
  
  const classOptions: SearchSelectOption[] = useMemo(
    () => ((classesResp as PaginatedResponse<ClassEntity>)?.data || [])
      .filter((cls) => cls?.status !== -2)
      .map((cls) => ({ value: cls.id, label: cls.title || `${t('planning.classNumber')}${cls.id}` })),
    [classesResp, t]
  );

  const handleAssign = async (studentId: number) => {
    if (isMutationLoading) return; // Prevent concurrent operations
    if (!classFilter || typeof classFilter !== 'number') {
      setFeedback(t('sections.selectClassFirstToAssign'));
      return;
    }

    const student = unassignedStudents.find((item) => item.id === studentId);
    if (!student) return;
    if (assignedStudents.some((item) => item.student.id === studentId)) return;

    setIsAssigning(true);
    try {
      const response = await createMut.mutateAsync({
        class_id: Number(classFilter),
        student_id: studentId,
        status: 1,
        tri: assignedStudents.length + 1,
      });

      const assignedStudent: AssignedStudent = {
        assignmentId: response.id,
        student: makeStudentLite(studentId, response.student ?? student),
        tri: response.tri ?? assignedStudents.length + 1,
        status: response.status,
        createdAt: response.created_at,
      };

      setAssignedStudents((prev) => [...prev, assignedStudent].sort((a, b) => a.tri - b.tri));
      setUnassignedStudents((prev) => prev.filter((item) => item.id !== studentId));
      setAssignedFilter('');
      setAssignedSearch('');
      setFeedback(null);
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || t('sections.failedToAssignStudent');
      setFeedback(message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (assignmentId: number) => {
    if (isMutationLoading) return; // Prevent concurrent operations
    const target = assignedStudents.find((item) => item.assignmentId === assignmentId);
    if (!target) return;

    setIsRemoving(true);
    try {
      await deleteMut.mutateAsync(assignmentId);
      setAssignedStudents((prev) => prev
        .filter((item) => item.assignmentId !== assignmentId)
        .map((item, index) => ({ ...item, tri: index + 1 }))
      );
      setUnassignedStudents((prev) => {
        if (prev.some((item) => item.id === target.student.id)) return prev;
        return [...prev, target.student].sort((a, b) => sortStudentsByLabel(a, b, t));
      });
      setUnassignedFilter('');
      setUnassignedSearch('');
      setFeedback(null);
      
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (err as { message?: string })?.message || t('sections.failedToUnassignStudent');
      setFeedback(message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (isMutationLoading) return; // Prevent drag operations during mutations
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const studentId = Number(draggableId);
    if (!studentId) return;

    if (source.droppableId === 'unassigned' && destination.droppableId === 'assigned') {
      await handleAssign(studentId);
    } else if (source.droppableId === 'assigned' && destination.droppableId === 'unassigned') {
      const target = assignedStudents.find((item) => item.student.id === studentId);
      if (target) {
        await handleUnassign(target.assignmentId);
      }
    }
  };

  // Reset class filter when year changes
  const handleYearChange = (value: string | number | '') => {
    setYearFilter(value === '' || value === undefined ? '' : Number(value));
    setClassFilter(''); // Reset class when year changes
    setAssignedStudents([]);
    setUnassignedStudents([]);
  };

  const statusFilterOptions: SearchSelectOption[] = useMemo(
    () => [
      { value: '', label: t('sections.allStatuses') },
      ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
    ],
    [t]
  );

  return (
    <>
      <PageHeader
        titleKey="pages.classStudentsTitle"
        descriptionKey="pages.classStudentsDescription"
        icon={<UserPlus className="w-5 h-5" />}
      />
      <div className="mb-6">

        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <SearchSelect
            label={`${t('sections.filterByYear')} *`}
            value={yearFilter}
            onChange={handleYearChange}
            options={yearOptions}
            placeholder={t('sections.selectYear')}
            isClearable
            isLoading={yearsLoading}
          />
          <SearchSelect
            label={`${t('sections.filterByClass')} *`}
            value={classFilter}
            onChange={(value) => {
              setClassFilter(value === '' ? '' : Number(value));
              setAssignedStudents([]);
              setUnassignedStudents([]);
            }}
            options={classOptions}
            placeholder={t('forms.selectClass')}
            isClearable
            isLoading={classesLoading}
            disabled={!yearFilter}
          />
          <SearchSelect
            label={t('common.status')}
            value={statusFilter === '' ? '' : String(statusFilter)}
            onChange={(value) => setStatusFilter(value === '' || value === undefined ? '' : Number(value))}
            options={statusFilterOptions}
            placeholder={t('sections.allStatuses')}
            isClearable
            disabled={!classFilter}
          />
        </div>
      </div>

      {!yearFilter || !classFilter ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">{t('sections.pleaseSelectYearAndClass')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {feedback && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{feedback}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchSelect
              label={t('sections.unassignedFilter')}
              value={unassignedFilter}
              onChange={(value) => setUnassignedFilter(value === '' ? '' : Number(value))}
              options={unassignedFilterOptions}
              placeholder={t('sections.filterUnassigned')}
              isClearable
              onSearchChange={setUnassignedSearch}
              noOptionsMessage={(query) => (query ? t('sections.noStudentsMatch') : t('sections.noUnassignedStudents'))}
            />
            <SearchSelect
              label={t('sections.assignedFilter')}
              value={assignedFilter}
              onChange={(value) => setAssignedFilter(value === '' ? '' : Number(value))}
              options={assignedFilterOptions}
              placeholder={t('sections.filterAssigned')}
              isClearable
              onSearchChange={setAssignedSearch}
              noOptionsMessage={(query) => (query ? t('sections.noAssignedStudentsMatch') : t('sections.noAssignedStudents'))}
            />
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{t('sections.unassignedStudents')}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {filteredUnassigned.length}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('sections.studentsNotAssigned')}{' '}
                    {filteredUnassigned.length === 0 
                      ? `- ${t('sections.noUnassignedStudentsText')}` 
                      : `- ${filteredUnassigned.length} ${filteredUnassigned.length === 1 ? t('sections.studentAvailable') : t('sections.studentsAvailable')}`}
                  </p>
                </div>
                <Droppable droppableId="unassigned" isDropDisabled={isMutationLoading}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`relative min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? 'border-green-500 bg-green-50/50 shadow-md'
                          : 'border-gray-300 bg-gray-50/50'
                      } ${isUnassignedLoading ? 'opacity-70' : ''} ${isMutationLoading ? 'pointer-events-none' : ''}`}
                    >
                      {isMutationLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-sm text-gray-600 font-medium">
                              {isAssigning ? t('sections.assigningStudent') : isRemoving ? t('sections.removingStudent') : t('sections.processing')}
                            </p>
                          </div>
                        </div>
                      )}
                      {isUnassignedLoading ? (
                        <div className="text-center text-gray-500 py-12">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                          <p className="text-sm">{t('forms.loadingStudents')}</p>
                        </div>
                      ) : filteredUnassigned.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-sm font-medium">{t('sections.noAvailableStudents')}</p>
                          <p className="text-xs mt-1">{t('sections.allStudentsAssigned')}</p>
                        </div>
                      ) : (
                        filteredUnassigned.map((item, index) => (
                          <Draggable
                            key={`unassigned-${item.id}`}
                            draggableId={item.id.toString()}
                            index={index}
                            isDragDisabled={isMutationLoading || !classFilter}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`mb-3 p-4 bg-white border rounded-lg transition-all duration-200 flex items-center justify-between ${
                                  dragSnapshot.isDragging 
                                    ? 'shadow-xl border-blue-400 scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{getStudentLabel(item, t)}</p>
                                  {item.email && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.email}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                  <StudentDetailsButton studentId={item.id} />
                                  <button
                                    type="button"
                                    onClick={() => handleAssign(item.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                    disabled={isMutationLoading || !classFilter}
                                  >
                                    {isAssigning ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>{t('sections.assigning')}</span>
                                      </>
                                    ) : (
                                      t('sections.assign')
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{t('sections.assignedStudents')}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {filteredAssigned.length}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {classOptions.find(opt => Number(opt.value) === classFilter)?.label || t('sidebar.classes')}
                    {' '}
                    {filteredAssigned.length === 0 
                      ? `- ${t('sections.noStudentsAssigned')}` 
                      : `- ${filteredAssigned.length} ${filteredAssigned.length === 1 ? t('sections.studentAssigned') : t('sections.studentsAssigned')}`}
                  </p>
                </div>
                <Droppable droppableId="assigned" isDropDisabled={!classFilter || isMutationLoading}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`relative min-h-[400px] p-4 border-2 border-dashed rounded-lg transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? 'border-blue-500 bg-blue-50/50 shadow-md'
                          : 'border-gray-300 bg-gray-50/50'
                      } ${(isAssignedLoading || !classFilter) ? 'opacity-70' : ''} ${isMutationLoading ? 'pointer-events-none' : ''}`}
                    >
                      {isMutationLoading && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            <p className="text-sm text-gray-600 font-medium">
                              {isAssigning ? t('sections.assigningStudent') : isRemoving ? t('sections.removingStudent') : t('sections.processing')}
                            </p>
                          </div>
                        </div>
                      )}
                      {!classFilter ? (
                        <div className="text-center text-gray-400 py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm font-medium">{t('sections.selectClassToManage')}</p>
                        </div>
                      ) : isAssignedLoading ? (
                        <div className="text-center text-gray-500 py-12">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                          <p className="text-sm">{t('sections.loadingAssignedStudents')}</p>
                        </div>
                      ) : filteredAssigned.length === 0 ? (
                        <div className="text-center text-gray-400 py-12">
                          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-sm font-medium">{t('sections.noStudentsAssigned')}</p>
                          <p className="text-xs mt-1">{t('sections.dragStudentsHere')}</p>
                        </div>
                      ) : (
                        filteredAssigned.map((item, index) => (
                          <Draggable
                            key={`assigned-${item.student.id}`}
                            draggableId={item.student.id.toString()}
                            index={index}
                            isDragDisabled={isMutationLoading}
                          >
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                className={`mb-3 p-4 bg-white border rounded-lg transition-all duration-200 flex items-center justify-between ${
                                  dragSnapshot.isDragging 
                                    ? 'shadow-xl border-red-400 scale-105' 
                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                                }`}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 truncate">{getStudentLabel(item.student, t)}</p>
                                  {item.student.email && (
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{item.student.email}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                  <StudentDetailsButton studentId={item.student.id} />
                                  <button
                                    type="button"
                                    onClick={() => handleUnassign(item.assignmentId)}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                    disabled={isMutationLoading}
                                  >
                                    {isRemoving ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        <span>{t('sections.removing')}</span>
                                      </>
                                    ) : (
                                      t('common.remove')
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </DragDropContext>
        </div>
      )}

    </>
  );
};

export default ClassStudentsSection;


