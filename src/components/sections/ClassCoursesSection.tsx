import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import Pagination from '../Pagination';
import ClassCourseModal, { type ClassCourseFormValues } from '../modals/ClassCourseModal';
import DeleteModal from '../modals/DeleteModal';
import DescriptionModal from '../modals/DescriptionModal';
import ClassCoursePlanningModal from '../modals/ClassCoursePlanningModal';
import { Button, EditButton, DeleteButton, PageHeader } from '../ui';
import { BookMarked, Info, Calendar } from 'lucide-react';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
import type { ClassCourse, ClassCourseStatus } from '../../api/classCourse';
import {
  useClassCourses,
  useCreateClassCourse,
  useUpdateClassCourse,
  useDeleteClassCourse,
} from '../../hooks/useClassCourses';
import { useModules } from '../../hooks/useModules';
import { useCourses } from '../../hooks/useCourses';
import { useLevels } from '../../hooks/useLevels';
import type { Level } from '../../api/level';

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

const getLevelInfo = (course: ClassCourse) => {
  const level = course.level;
  if (!level) return '—';
  const program = level.specialization?.program?.title;
  const specialization = level.specialization?.title;
  const levelTitle = level.title;
  
  const parts = [program, specialization, levelTitle].filter(Boolean);
  return parts.join(' / ') || '—';
};

const ClassCoursesSection: React.FC = () => {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [filters, setFilters] = useState({
    status: 'all',
    level: '',
    moduleId: '',
    courseId: '',
  });
  
  const statusFilterOptions = useMemo(() => getStatusFilterOptions(t), [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<ClassCourse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassCourse | null>(null);
  const [planningModalOpen, setPlanningModalOpen] = useState(false);
  const [selectedClassCourseForPlanning, setSelectedClassCourseForPlanning] = useState<ClassCourse | null>(null);
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
      level_id: filters.level ? Number(filters.level) : undefined,
      module_id: filters.moduleId ? Number(filters.moduleId) : undefined,
      course_id: filters.courseId ? Number(filters.courseId) : undefined,
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

  const { data: modulesResp } = useModules({ page: 1, limit: 100 });
  const { data: coursesResp } = useCourses({ page: 1, limit: 100 });
  const { data: levelsResp } = useLevels({ page: 1, limit: 100 });
  const levels = useMemo(() => (levelsResp?.data || []) as Level[], [levelsResp]);

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

  const levelOptions = useMemo<SearchSelectOption[]>(
    () => levels.map((level) => ({ value: level.id, label: level.title })),
    [levels]
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

  const handleSubmit = async (values: ClassCourseFormValues) => {
    setModalError(null);
    setAlert(null);

    try {
      const payload = {
        level_id: Number(values.level_id),
        module_id: Number(values.module_id),
        course_id: Number(values.course_id),
        volume: values.volume.trim() ? Number(values.volume) : undefined,
        description: values.description.trim() ? values.description : undefined,
      };

      if (editingCourse) {
        await updateMut.mutateAsync({
          id: editingCourse.id,
          data: payload,
        });
        setAlert({ type: 'success', message: t('messages.classCourseUpdatedSuccessfully') });
      } else {
        // For creation, always set status to pending (2)
        await createMut.mutateAsync({
          ...payload,
          status: 2, // Pending
        });
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
      <PageHeader
        titleKey="pages.classCoursesTitle"
        descriptionKey="pages.classCoursesDescription"
        icon={<BookMarked className="w-5 h-5" />}
        actions={
          <Button type="button" variant="primary" onClick={openCreateModal} className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('forms.addClassCourse')}
          </Button>
        }
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SearchSelect
          label={t('common.status')}
          value={filters.status}
          onChange={handleFilterChange('status')}
          options={statusFilterOptions}
          isClearable={false}
        />
        <SearchSelect
          label={t('sidebar.levels')}
          value={filters.level}
          onChange={handleFilterChange('level')}
          options={levelOptions}
          placeholder={t('sections.allLevels') || 'All levels'}
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
      </div>

      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.levels')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.modules')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.courses')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">{t('sections.volume')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">{t('common.status')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    {t('forms.loadingClassCourses')}
                  </td>
                </tr>
              ) : classCourses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted">
                    {t('forms.noClassCoursesFound')}
                  </td>
                </tr>
              ) : (
                classCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {getLevelInfo(course)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {course.module?.title || `${t('forms.moduleNumber')}${course.module_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {course.course?.title || `${t('forms.courseNumber')}${course.course_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {course.volume === null || course.volume === undefined ? '—' : `${course.volume} `}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[course.status] ?? 'bg-gray-100 text-gray-800'
                        }`}
                      >
                          {STATUS_VALUE_LABEL[course.status] ?? `${t('common.status')} ${course.status}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setDescriptionPreview({
                              title: course.title ?? `${t('forms.courseNumber')}${course.id}`,
                              description: course.description || '',
                            })
                          }
                          className="inline-flex items-center justify-center rounded-md border border-tertiary bg-white px-2.5 py-1.5 text-xs font-medium text-body hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={t('common.viewDetails')}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClassCourseForPlanning(course);
                            setPlanningModalOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-green-200 bg-white px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                          title={t('forms.addToPlanning') || 'Add to Planning'}
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
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
        moduleOptions={moduleOptions}
        courseOptions={courseOptions}
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

      <ClassCoursePlanningModal
        isOpen={planningModalOpen}
        onClose={() => {
          setPlanningModalOpen(false);
          setSelectedClassCourseForPlanning(null);
        }}
        classCourse={selectedClassCourseForPlanning}
      />
    </div>
  );
};

export default ClassCoursesSection;


