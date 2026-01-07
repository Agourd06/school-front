import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import ClassCourseModal, { type ClassCourseFormValues } from '../modals/ClassCourseModal';
import DeleteModal from '../modals/DeleteModal';
import DescriptionModal from '../modals/DescriptionModal';
import { Button, EditButton, DeleteButton } from '../ui';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
import type { ClassCourse, ClassCourseStatus } from '../../api/classCourse';
import {
  useClassCourses,
  useCreateClassCourse,
  useUpdateClassCourse,
  useDeleteClassCourse,
} from '../../hooks/useClassCourses';
import { useClasses } from '../../hooks/useClasses';
import { useModules } from '../../hooks/useModules';
import { useCourses } from '../../hooks/useCourses';
import { useTeachers } from '../../hooks/useTeachers';

const EMPTY_META = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
};

const getStatusFilterOptions = (t: (key: string) => string): SearchSelectOption[] => [
  { value: 'all', label: t('sections.allStatuses') },
  ...STATUS_OPTIONS.map((opt) => ({ value: String(opt.value), label: opt.label })),
];

const statusStyles: Record<number, string> = {
  2: 'bg-yellow-100 text-yellow-800',
  1: 'bg-green-100 text-green-800',
  0: 'bg-gray-200 text-gray-700',
  [-1]: 'bg-purple-100 text-purple-700',
  [-2]: 'bg-red-100 text-red-700',
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

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const getTeacherName = (course: ClassCourse, t: (key: string) => string) => {
  const first = course.teacher?.first_name ?? '';
  const last = course.teacher?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  return course.teacher?.email ?? `${t('planning.teacherNumber')}${course.teacher_id}`;
};

const ClassCoursesSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    classId: '',
    moduleId: '',
    courseId: '',
    teacherId: '',
    allday: '',
    search: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ClassCourse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassCourse | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [descriptionPreview, setDescriptionPreview] = useState<{ title: string; description: string } | null>(null);

  const params = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      status:
        filters.status === 'all'
          ? undefined
          : (Number(filters.status) as ClassCourseStatus),
      class_id: filters.classId ? Number(filters.classId) : undefined,
      module_id: filters.moduleId ? Number(filters.moduleId) : undefined,
      course_id: filters.courseId ? Number(filters.courseId) : undefined,
      teacher_id: filters.teacherId ? Number(filters.teacherId) : undefined,
      allday: filters.allday === '' ? undefined : filters.allday === 'true',
      search: filters.search.trim() || undefined,
    }),
    [filters, pagination]
  );

  const {
    data: classCoursesResp,
    isLoading,
    error,
    refetch,
  } = useClassCourses(params);

  const classCourses = classCoursesResp?.data ?? [];
  const meta = classCoursesResp?.meta ?? { ...EMPTY_META, page: pagination.page, limit: pagination.limit };

  const createMut = useCreateClassCourse();
  const updateMut = useUpdateClassCourse();
  const deleteMut = useDeleteClassCourse();

  const { data: classesResp } = useClasses({ page: 1, limit: 100 });
  const { data: modulesResp } = useModules({ page: 1, limit: 100 });
  const { data: coursesResp } = useCourses({ page: 1, limit: 100 });
  const { data: teachersResp } = useTeachers({ page: 1, limit: 100 });

  const classOptions = useMemo<SearchSelectOption[]>(
    () =>
      (classesResp?.data || []).map((item) => ({
        value: item.id,
        label: item.title || `${t('planning.classNumber')}${item.id}`,
      })),
    [classesResp, t]
  );

  const moduleOptions = useMemo<SearchSelectOption[]>(
    () =>
      (modulesResp?.data || []).map((item) => ({
        value: item.id,
        label: item.title || `${t('forms.moduleNumber')}${item.id}`,
      })),
    [modulesResp, t]
  );

  const courseOptions = useMemo<SearchSelectOption[]>(
    () =>
      (coursesResp?.data || []).map((item) => ({
        value: item.id,
        label: item.title || `${t('forms.courseNumber')}${item.id}`,
        data: item,
      })),
    [coursesResp, t]
  );

  const teacherOptions = useMemo<SearchSelectOption[]>(
    () =>
      (teachersResp?.data || []).map((teacher) => {
        const first = teacher.first_name ?? '';
        const last = teacher.last_name ?? '';
        const full = `${first} ${last}`.trim() || teacher.email || `${t('planning.teacherNumber')}${teacher.id}`;
        return {
          value: teacher.id,
          label: full,
        };
      }),
    [teachersResp, t]
  );

  const openCreateModal = () => {
    setEditingCourse(null);
    setModalError(null);
    setModalOpen(true);
  };

  const openEditModal = (course: ClassCourse) => {
    setEditingCourse(course);
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingCourse(null);
    setModalError(null);
  };

  const handleFilterChange = (field: keyof typeof filters) => (value: number | string | '') => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === undefined || value === null ? '' : String(value),
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleAlldayChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      allday: event.target.value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSubmit = async (values: ClassCourseFormValues) => {
    setModalError(null);
    setAlert(null);
    const weeklyFrequency =
      values.allday || !values.weeklyFrequency.trim() ? undefined : Number(values.weeklyFrequency);

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() ? values.description : undefined,
      status: values.status,
      class_id: Number(values.class_id),
      module_id: Number(values.module_id),
      course_id: Number(values.course_id),
      teacher_id: Number(values.teacher_id),
      volume: values.volume.trim() ? Number(values.volume) : undefined,
      weeklyFrequency,
      allday: values.allday,
      duration: Number(values.duration),
    };

    try {
      if (editingCourse) {
        await updateMut.mutateAsync({ id: editingCourse.id, data: payload });
        setAlert({ type: 'success', message: t('messages.classCourseUpdatedSuccessfully') });
      } else {
        await createMut.mutateAsync(payload);
        setAlert({ type: 'success', message: t('messages.classCourseCreatedSuccessfully') });
      }
      closeModal();
      refetch();
    } catch (err) {
      const message = extractErrorMessage(err, t);
      setModalError(message);
      setAlert({ type: 'error', message });
      throw err;
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.classCourseDeletedSuccessfully') });
      refetch();
    } catch (err) {
      const message = extractErrorMessage(err, t);
      setAlert({ type: 'error', message });
    }
  };

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t('sidebar.classCourses')}</h1>
          <p className="text-sm text-gray-500">{t('forms.manageCoursesAssignedToClasses')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="primary" onClick={openCreateModal} className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('forms.addClassCourse')}
          </Button>
        </div>
      </div>

      {alert && (
        <div
          className={`rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-success-light bg-success-light text-success-dark'
              : 'border-danger-light bg-danger-light text-danger-dark'
          }`}
        >
          {alert.message}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {(error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <SearchSelect
          label={t('common.status')}
          value={filters.status}
          onChange={handleFilterChange('status')}
          options={statusFilterOptions}
          isClearable={false}
        />
        <SearchSelect
          label={t('sidebar.classes')}
          value={filters.classId}
          onChange={handleFilterChange('classId')}
          options={classOptions}
          placeholder={t('forms.allClasses')}
        />
        <SearchSelect
          label={t('sidebar.modules')}
          value={filters.moduleId}
          onChange={handleFilterChange('moduleId')}
          options={moduleOptions}
          placeholder={t('forms.allModules')}
        />
        <SearchSelect
          label={t('sidebar.courses')}
          value={filters.courseId}
          onChange={handleFilterChange('courseId')}
          options={courseOptions}
          placeholder={t('sections.allCourses')}
        />
        <SearchSelect
          label={t('sidebar.teachers')}
          value={filters.teacherId}
          onChange={handleFilterChange('teacherId')}
          options={teacherOptions}
          placeholder={t('sections.allTeachers')}
        />
        <div>
          <label className="block text-sm font-medium text-body">{t('forms.allDay')}</label>
          <select
            value={filters.allday}
            onChange={handleAlldayChange}
            className="custom-select mt-1 block w-full rounded-md border border-border bg-card text-body px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          >
            <option value="">{t('forms.allSessions')}</option>
            <option value="true">{t('forms.allDayOnly')}</option>
            <option value="false">{t('forms.timedSessions')}</option>
          </select>
        </div>
        <div className="xl:col-span-2">
          <label className="block text-sm font-medium text-gray-700">{t('common.search')}</label>
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t('forms.titleDescriptionOrTeacher')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.name')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('forms.classModuleCourse')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('sections.teacher')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('forms.schedule')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('sections.volume')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t('forms.updated')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.loadingClassCourses')}
                  </td>
                </tr>
              ) : classCourses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                    {t('forms.noClassCoursesFound')}
                  </td>
                </tr>
              ) : (
                classCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                      <div>{course.title}</div>
                      <button
                        type="button"
                        className="text-xs text-primary hover:underline"
                        onClick={() =>
                          setDescriptionPreview({
                            title: course.title ?? `${t('forms.courseNumber')}${course.id}`,
                            description: course.description || '',
                          })
                        }
                      >
                        {t('forms.viewDescription')}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{course.class?.title || `${t('planning.classNumber')}${course.class_id}`}</div>
                      <div className="text-xs text-gray-500">
                        {course.module?.title || `${t('forms.moduleNumber')}${course.module_id}`} ·{' '}
                        {course.course?.title || `${t('forms.courseNumber')}${course.course_id}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getTeacherName(course, t)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{course.weeklyFrequency ? `${course.weeklyFrequency}${t('forms.timesPerWeek')}` : '—'}</div>
                      <div>{course.duration ? `${course.duration}${t('forms.hoursSession')}` : '—'}</div>
                      <div className="text-xs text-gray-500">{course.allday ? t('forms.allDay') : t('forms.timed')}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {course.volume === null || course.volume === undefined ? '—' : `${course.volume} `}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[course.status] ?? 'bg-gray-100 text-gray-600'
                        }`}
                      >
                          {STATUS_VALUE_LABEL[course.status] ?? `${t('common.status')} ${course.status}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(course.updated_at)}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <EditButton onClick={() => openEditModal(course)} />
                        <DeleteButton onClick={() => setDeleteTarget(course)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={meta.page}
          totalPages={meta.totalPages}
          totalItems={meta.total}
          itemsPerPage={meta.limit}
          hasNext={meta.hasNext}
          hasPrevious={meta.hasPrevious}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onPageSizeChange={(limit) => setPagination({ page: 1, limit })}
          isLoading={isLoading}
        />
      </div>

      <ClassCourseModal
        isOpen={modalOpen}
        onClose={closeModal}
        initialData={editingCourse ?? undefined}
        onSubmit={handleSubmit}
        isSubmitting={createMut.isPending || updateMut.isPending}
        serverError={modalError}
        classOptions={classOptions}
        moduleOptions={moduleOptions}
        courseOptions={courseOptions}
        teacherOptions={teacherOptions}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMut.isPending}
        title={t('forms.deleteClassCourse')}
        entityName={deleteTarget ? deleteTarget.title : undefined}
      />

      <DescriptionModal
        isOpen={!!descriptionPreview}
        onClose={() => setDescriptionPreview(null)}
        title={descriptionPreview?.title ?? ''}
        description={descriptionPreview?.description ?? ''}
        type="class course"
      />
    </div>
  );
};

export default ClassCoursesSection;


