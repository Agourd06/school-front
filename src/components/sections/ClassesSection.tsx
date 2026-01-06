import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { FilterParams, ListState } from '../../types/api';
import SearchBar from '../../components/SearchBar';
import FilterDropdown from '../../components/FilterDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../ui';
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

const extractErrorMessage = (err: unknown): string => {
  if (!err) return 'Unexpected error';
  const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
  const dataMessage = axiosError?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof axiosError.message === 'string') return axiosError.message;
  return 'Unexpected error';
};

const ClassesSection: React.FC = () => {
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

  const { data: response, isLoading, error, refetch: refetchClasses } = useClasses(params);

  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as { message?: string })?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

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
  // Filter out completed school years - allow planned and ongoing
  const availableSchoolYears = useMemo(() => 
    schoolYears.filter((year: SchoolYear) => year.lifecycle_status !== 'completed'),
    [schoolYears]
  );
  const schoolYearOptions: SearchSelectOption[] = useMemo(
    () => availableSchoolYears.map((year: SchoolYear) => ({ value: year.id, label: year.title })),
    [availableSchoolYears]
  );

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
      setAlert({ type: 'success', message: 'Class deleted successfully.' });
      refetchClasses();
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
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
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
        <SearchSelect
          label="Program"
          value={programFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setProgramFilter(numeric);
            setSpecializationFilter('');
            setLevelFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder="All programs"
          options={programOptions}
          isClearable
        />
        <SearchSelect
          label="Specialization"
          value={specializationFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setSpecializationFilter(numeric);
            setLevelFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder="All specializations"
          options={specializationOptions}
          isClearable
          disabled={!programFilter}
        />
        <SearchSelect
          label="Level"
          value={levelFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setLevelFilter(numeric);
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder="All levels"
          options={levelOptions}
          isClearable
          disabled={!specializationFilter}
        />
        <SearchSelect
          label="School Year"
          value={schoolYearFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setSchoolYearFilter(numeric);
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder="All school years"
          options={schoolYearOptions}
          isClearable
        />
      </div>

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

      <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-heading">Classes</h3>
          <Button
            type="button"
            variant="primary"
            onClick={() => openModal(undefined)}
            className="inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Class
          </Button>
        </div>

        <div className="px-4 py-3 bg-surface border-b border-border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar onSearch={handleSearch} placeholder="Search by class title..." isLoading={state.loading} />
            </div>
            <div className="w-full sm:w-48">
              <FilterDropdown
                options={STATUS_OPTIONS}
                value={(state.filters as { status?: number | null }).status ?? null}
                onChange={(val) => setState(prev => ({ ...prev, filters: { ...prev.filters, status: val === null ? null : Number(val) }, pagination: { ...prev.pagination, page: 1 } }))}
                placeholder="Filter by status"
                isLoading={state.loading}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Program
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Specialization
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  School Year
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {state.loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    Loading classes…
                  </td>
                </tr>
              ) : state.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                    {(state.filters as { search?: string }).search
                      ? `No classes found matching "${(state.filters as { search?: string }).search}"`
                      : 'No classes found.'}
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
                            onClick={() => openDetailsModal(cls)}
                            className="inline-flex items-center justify-center rounded-full p-1.5 text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                            title="View details"
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
        title="Delete Class"
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


