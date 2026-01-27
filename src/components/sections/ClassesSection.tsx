import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { FilterParams, ListState } from '../../types/api';
import SearchBar from '../../components/SearchBar';
import FilterDropdown from '../../components/FilterDropdown';
import Pagination from '../../components/Pagination';
import { Button, PageHeader } from '../ui';
import { Users, UserCheck } from 'lucide-react';
import { useClasses, useDeleteClass } from '../../hooks/useClasses';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { ClassModal, DeleteModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { EditButton, DeleteButton } from '../ui';
import SearchSelect from '../inputs/SearchSelect';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS } from '../../constants/status';
import DescriptionModal from '../modals/DescriptionModal';
import type { ClassEntity } from '../../api/classes';
import type { Program } from '../../api/program';
import type { Specialization } from '../../api/specialization';
import type { Level } from '../../api/level';
import type { SchoolYear } from '../../api/schoolYear';
import { Info } from 'lucide-react';

const extractErrorMessage = (err: unknown, t: (key: string) => string): string => {
  if (!err) return t('messages.unexpectedError');
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return t('messages.unexpectedError');
};

const ClassesSection: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = React.useState<ListState<ClassEntity>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'class' | null; data?: ClassEntity }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string; classId?: number } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [programFilter, setProgramFilter] = React.useState<number | ''>('');
  const [specializationFilter, setSpecializationFilter] = React.useState<number | ''>('');
  const [levelFilter, setLevelFilter] = React.useState<number | ''>('');
  const [schoolYearFilter, setSchoolYearFilter] = React.useState<number | ''>('');

  const params: FilterParams & {
    program_id?: number;
    specialization_id?: number;
    level_id?: number;
    school_year_id?: number;
    student_id?: number;
  } = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as { status?: number | null }).status,
    program_id: programFilter ? Number(programFilter) : undefined,
    specialization_id: specializationFilter ? Number(specializationFilter) : undefined,
    level_id: levelFilter ? Number(levelFilter) : undefined,
    school_year_id: schoolYearFilter ? Number(schoolYearFilter) : undefined,
    student_id: undefined, // Removed student_id from params
  };

  // Only fetch classes when school year is selected
  const { data: response, isLoading, error, refetch: refetchClasses } = useClasses(
    schoolYearFilter ? params : { page: 1, limit: 10 }
  );

  React.useEffect(() => {
    if (response && schoolYearFilter) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as { message?: string })?.message || null,
        pagination: response.meta,
      }));
    } else if (!schoolYearFilter) {
      // Clear data when school year is not selected
      setState(prev => ({
        ...prev,
        data: [],
        loading: false,
        error: null,
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
      }));
    }
  }, [response, isLoading, error, schoolYearFilter]);

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 });
  const programs = useMemo(() => (programsResp?.data || []) as Program[], [programsResp]);
  const programOptions: SearchSelectOption[] = useMemo(
    () => programs.map((program: Program) => ({ value: program.id, label: program.title })),
    [programs]
  );

  const { data: specializationsResp } = useSpecializations({ page: 1, limit: 100, program_id: programFilter ? Number(programFilter) : undefined });
  const specializations = useMemo(() => (specializationsResp?.data || []) as Specialization[], [specializationsResp]);
  const specializationOptions: SearchSelectOption[] = useMemo(
    () => specializations.map((spec: Specialization) => ({ value: spec.id, label: spec.title })),
    [specializations]
  );

  const { data: levelsResp } = useLevels({ page: 1, limit: 100, specialization_id: specializationFilter ? Number(specializationFilter) : undefined });
  const levels = useMemo(() => (levelsResp?.data || []) as Level[], [levelsResp]);
  const levelOptions: SearchSelectOption[] = useMemo(
    () => levels.map((lvl: Level) => ({ value: lvl.id, label: lvl.title })),
    [levels]
  );

  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 });
  const schoolYears = useMemo(() => (schoolYearsResp?.data || []) as SchoolYear[], [schoolYearsResp]);
  // Include all school years (completed, ongoing, planned)
  const schoolYearOptions: SearchSelectOption[] = useMemo(
    () => schoolYears.map((year: SchoolYear) => ({ 
      value: year.id, 
      label: year.title,
      lifecycleStatus: year.lifecycle_status as 'planned' | 'ongoing' | 'completed' | undefined
    })),
    [schoolYears]
  );

  // Get ongoing school year and set it as default
  const ongoingSchoolYear = useMemo(() => {
    return schoolYears.find((year: SchoolYear) => year.lifecycle_status === 'ongoing');
  }, [schoolYears]);

  // Set default ongoing school year on mount
  useEffect(() => {
    if (ongoingSchoolYear && !schoolYearFilter) {
      setSchoolYearFilter(ongoingSchoolYear.id);
    }
  }, [ongoingSchoolYear, schoolYearFilter]);

  const deleteClassMut = useDeleteClass();

  const requestDelete = (id: number) => {
    const classItem = state.data.find((item: ClassEntity) => item.id === id);
    if (!classItem) return;
    setDeleteTarget({ id, name: classItem.title });
    setAlert(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setAlert(null);
    try {
      await deleteClassMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      setAlert({ type: 'success', message: t('messages.classDeletedSuccessfully') });
      refetchClasses();
    } catch (err: unknown) {
      const message = extractErrorMessage(err, t);
      setAlert({ type: 'error', message });
    }
  };

  const openModal = (data?: ClassEntity) => setModal({ type: 'class', data });
  const closeModal = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as { search?: string }).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return {
        ...prev,
        filters: { ...prev.filters, search: q },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const openDetailsModal = (cls: ClassEntity) => {
    setDescriptionModal({
      title: cls.title || `Class #${cls.id}`,
      description: cls.description || '<p class="text-muted italic">No description available</p>',
      classId: cls.id, // Pass class ID to fetch students
    });
  };

  const closeDescriptionModal = () => setDescriptionModal(null);

  useEffect(() => {
    if (!alert) return;
    const timeout = window.setTimeout(() => setAlert(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [alert]);

  return (
    <>
      {alert && (
        <div
          className={`mb-4 rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-success-light bg-success-light text-success-dark'
              : 'border-danger-light bg-danger-light text-danger-dark'
          }`}
        >
          {alert.message}
        </div>
      )}

      <PageHeader
        titleKey="pages.classesTitle"
        descriptionKey="pages.classesDescription"
        icon={<Users className="w-5 h-5" />}
        actions={
          <Button
            type="button"
            variant="primary"
            onClick={() => openModal(undefined)}
            className="inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('sections.addClass')}
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <SearchSelect
          label={`${t('sidebar.schoolYears')} *`}
          value={schoolYearFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setSchoolYearFilter(numeric);
            // Reset other filters when school year changes
            setProgramFilter('');
            setSpecializationFilter('');
            setLevelFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder={t('sections.selectSchoolYear')}
          options={schoolYearOptions}
          isClearable={false}
        />
        <SearchSelect
          label={t('sidebar.programs')}
          value={programFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setProgramFilter(numeric);
            setSpecializationFilter('');
            setLevelFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder={t('sections.allPrograms')}
          options={programOptions}
          isClearable
          disabled={!schoolYearFilter}
        />
        <SearchSelect
          label={t('dashboard.specializations')}
          value={specializationFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setSpecializationFilter(numeric);
            setLevelFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder={t('sections.allSpecializations')}
          options={specializationOptions}
          isClearable
          disabled={!programFilter}
        />
        <SearchSelect
          label={t('sidebar.levels')}
          value={levelFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setLevelFilter(numeric);
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder={t('sections.allLevels')}
          options={levelOptions}
          isClearable
          disabled={!specializationFilter}
        />
      </div>

      {/* Search and Status Filters */}
      <div className="mb-4 bg-white shadow-sm rounded-lg border border-gray-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar onSearch={handleSearch} placeholder="Search by class title..." isLoading={state.loading} />
          </div>
          <div className="w-full sm:w-48">
            <FilterDropdown
              options={STATUS_OPTIONS}
              value={(state.filters as { status?: number | null }).status ?? null}
              onChange={(val) => setState(prev => ({ ...prev, filters: { ...prev.filters, status: val === null ? null : Number(val) }, pagination: { ...prev.pagination, page: 1 } }))}
              placeholder={t('sections.filterByStatus')}
              isLoading={state.loading}
            />
          </div>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-xl border border-gray-200 overflow-hidden transition-shadow duration-200 hover:shadow-lg">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('common.name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.programs')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('dashboard.specializations')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.levels')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('sidebar.schoolYears')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  {t('common.status')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {!schoolYearFilter ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    {t('sections.selectSchoolYearToViewClasses') || 'Please select a school year to view classes.'}
                  </td>
                </tr>
              ) : state.loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    {t('sections.loadingClasses')}
                  </td>
                </tr>
              ) : state.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    {(state.filters as { search?: string }).search
                      ? t('sections.noClassesFoundMatching', { search: (state.filters as { search?: string }).search })
                      : t('sections.noClassesFound')}
                  </td>
                </tr>
              ) : (
                state.data.map((cls: ClassEntity) => {
                  const programTitle = cls.program?.title || programs.find(p => p.id === cls.program_id)?.title || '—';
                  const specializationTitle =
                    cls.specialization?.title || specializations.find(s => s.id === cls.specialization_id)?.title || '—';
                  const levelTitle = cls.level?.title || levels.find(l => l.id === cls.level_id)?.title || '—';
                  const schoolYearTitle = cls.schoolYear?.title || availableSchoolYears.find(y => y.id === cls.school_year_id)?.title || '—';

                  return (
                    <tr key={cls.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-heading">
                        {cls.title || `Class #${cls.id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{programTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{specializationTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{levelTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{schoolYearTitle}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <StatusBadge value={cls.status} />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/class-students?classId=${cls.id}`)}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border border-blue-200"
                            title={t('sections.manageStudents') || 'Manage Students'}
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetailsModal(cls)}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            title={t('common.viewDetails')}
                          >
                            <Info className="h-4 w-4" />
                          </button>
                          <EditButton onClick={() => openModal(cls)} />
                          <DeleteButton onClick={() => requestDelete(cls.id)} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {state.pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200">
            <Pagination
              currentPage={state.pagination.page}
              totalPages={state.pagination.totalPages}
              totalItems={state.pagination.total}
              itemsPerPage={state.pagination.limit}
              onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
              onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
              hasNext={state.pagination.hasNext}
              hasPrevious={state.pagination.hasPrevious}
            />
          </div>
        )}
      </div>

      {modal.type === 'class' && (
        <ClassModal 
          isOpen 
          onClose={closeModal} 
          classItem={modal.data ? {
            ...modal.data,
            program: modal.data.program ?? undefined,
            specialization: modal.data.specialization ?? undefined,
            level: modal.data.level ?? undefined,
            schoolYear: modal.data.schoolYear ?? undefined,
          } : undefined} 
          descriptionPosition="bottom" 
        />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title={t('modals.delete') + ' ' + t('sidebar.classes')}
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteClassMut.isPending}
      />

      {descriptionModal && (
        <DescriptionModal
          isOpen
          onClose={closeDescriptionModal}
          title={descriptionModal.title}
          description={descriptionModal.description}
          type="class"
          classId={descriptionModal.classId}
        />
      )}
    </>
  );
};

export default ClassesSection;


