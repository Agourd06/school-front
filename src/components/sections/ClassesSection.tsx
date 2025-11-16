import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useClasses, useDeleteClass } from '../../hooks/useClasses';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { ClassModal, DeleteModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import SearchSelect from '../inputs/SearchSelect';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS, STATUS_VALUE_LABEL } from '../../constants/status';
import DescriptionModal from '../modals/DescriptionModal';

const extractErrorMessage = (err: any): string => {
  if (!err) return 'Unexpected error';
  const dataMessage = err?.response?.data?.message;
  if (Array.isArray(dataMessage)) return dataMessage.join(', ');
  if (typeof dataMessage === 'string') return dataMessage;
  if (typeof err.message === 'string') return err.message;
  return 'Unexpected error';
};

const ClassesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'class' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);
  const [descriptionModal, setDescriptionModal] = useState<{ title: string; description: string } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [programFilter, setProgramFilter] = React.useState<number | ''>('');
  const [specializationFilter, setSpecializationFilter] = React.useState<number | ''>('');
  const [levelFilter, setLevelFilter] = React.useState<number | ''>('');
  const [schoolYearFilter, setSchoolYearFilter] = React.useState<number | ''>('');
  const [periodFilter, setPeriodFilter] = React.useState<number | ''>('');

  const params: FilterParams & {
    program_id?: number;
    specialization_id?: number;
    level_id?: number;
    school_year_id?: number;
    school_year_period_id?: number;
    student_id?: number;
  } = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status,
    program_id: programFilter ? Number(programFilter) : undefined,
    specialization_id: specializationFilter ? Number(specializationFilter) : undefined,
    level_id: levelFilter ? Number(levelFilter) : undefined,
    school_year_id: schoolYearFilter ? Number(schoolYearFilter) : undefined,
    school_year_period_id: periodFilter ? Number(periodFilter) : undefined,
    student_id: undefined, // Removed student_id from params
  };

  const { data: response, isLoading, error, refetch: refetchClasses } = useClasses(params as any);

  React.useEffect(() => {
    if (response) {
      setState(prev => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as any)?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

  const { data: programsResp } = usePrograms({ page: 1, limit: 100 } as any);
  const programs = useMemo(() => ((programsResp as any)?.data || []) as any[], [programsResp]);
  const programOptions: SearchSelectOption[] = useMemo(
    () => programs.map((program: any) => ({ value: program.id, label: program.title })),
    [programs]
  );

  const { data: specializationsResp } = useSpecializations({ page: 1, limit: 100, program_id: programFilter ? Number(programFilter) : undefined } as any);
  const specializations = useMemo(() => ((specializationsResp as any)?.data || []) as any[], [specializationsResp]);
  const specializationOptions: SearchSelectOption[] = useMemo(
    () => specializations.map((spec: any) => ({ value: spec.id, label: spec.title })),
    [specializations]
  );

  const { data: levelsResp } = useLevels({ page: 1, limit: 100, specialization_id: specializationFilter ? Number(specializationFilter) : undefined } as any);
  const levels = useMemo(() => ((levelsResp as any)?.data || []) as any[], [levelsResp]);
  const levelOptions: SearchSelectOption[] = useMemo(
    () => levels.map((lvl: any) => ({ value: lvl.id, label: lvl.title })),
    [levels]
  );

  const { data: schoolYearsResp } = useSchoolYears({ page: 1, limit: 100 } as any);
  const schoolYears = useMemo(() => ((schoolYearsResp as any)?.data || []) as any[], [schoolYearsResp]);
  const schoolYearOptions: SearchSelectOption[] = useMemo(
    () => schoolYears.map((year: any) => ({ value: year.id, label: year.title })),
    [schoolYears]
  );

  const { data: periodsResp, isLoading: periodsLoading, error: periodsError } = useSchoolYearPeriods({
    page: 1,
    limit: 100,
    school_year_id: schoolYearFilter ? Number(schoolYearFilter) : undefined,
  } as any);
  const periods = useMemo(() => ((periodsResp as any)?.data || []) as any[], [periodsResp]);
  const periodOptions: SearchSelectOption[] = useMemo(
    () => periods.map((period: any) => ({ value: period.id, label: period.title })),
    [periods]
  );

  const deleteClassMut = useDeleteClass();

  const requestDelete = (id: number) => {
    const classItem = state.data.find((item: any) => item.id === id);
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
    } catch (err: any) {
      const message = extractErrorMessage(err);
      setAlert({ type: 'error', message });
    }
  };

  const openModal = (data?: any) => setModal({ type: 'class', data });
  const closeModal = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return {
        ...prev,
        filters: { ...prev.filters, search: q },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const openDetailsModal = (cls: any) => {
    setDescriptionModal({
      title: cls.title || `Class #${cls.id}`,
      description: cls.description || '<p class="text-gray-500 italic">No description available</p>',
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
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
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
            setPeriodFilter('');
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder="All school years"
          options={schoolYearOptions}
          isClearable
        />
        <SearchSelect
          label="Period"
          value={periodFilter}
          onChange={(val) => {
            const numeric = val === '' ? '' : Number(val);
            setPeriodFilter(numeric);
            setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          placeholder={schoolYearFilter ? 'All periods' : ' school year first'}
          options={periodOptions}
          isClearable
          disabled={!schoolYearFilter}
          isLoading={periodsLoading}
          error={periodsError ? 'Failed to load periods' : null}
        />
      </div>

      {alert && (
        <div
          className={`mb-4 rounded-md border px-4 py-2 text-sm ${
            alert.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {alert.message}
        </div>
      )}

      <DataTableGeneric
        title="Classes"
        state={state}
        onAdd={() => openModal(null)}
        onEdit={(item) => openModal(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Class"
        searchPlaceholder="Search by class title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(cls: any, onEdit, onDelete, index) => {
          const programTitle = cls.program?.title || programs.find(p => p.id === cls.program_id)?.title || '—';
          const specializationTitle =
            cls.specialization?.title || specializations.find(s => s.id === cls.specialization_id)?.title || '—';
          const levelTitle = cls.level?.title || levels.find(l => l.id === cls.level_id)?.title || '—';
          const schoolYearTitle = cls.schoolYear?.title || schoolYears.find(y => y.id === cls.school_year_id)?.title || '—';
          const periodTitle = cls.schoolYearPeriod?.title || periods.find(p => p.id === cls.school_year_period_id)?.title || '—';
          const statusLabel = STATUS_VALUE_LABEL[Number(cls.status)] || String(cls.status ?? '—');

          return (
            <li
              key={cls?.id ?? `class-${index}`}
              className="px-4 py-4 sm:px-6"
            >
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{cls.title || `Class #${cls.id}`}</h3>
                      <StatusBadge value={cls.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {cls.code ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                          {cls.code}
                        </span>
                      ) : null}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-gray-500 sm:grid-cols-2">
                      <span>Program: <span className="font-medium text-gray-900">{programTitle}</span></span>
                      <span>Specialization: <span className="font-medium text-gray-900">{specializationTitle}</span></span>
                      <span>Level: <span className="font-medium text-gray-900">{levelTitle}</span></span>
                      <span>School Year: <span className="font-medium text-gray-900">{schoolYearTitle}</span></span>
                      <span>Period: <span className="font-medium text-gray-900">{periodTitle}</span></span>
                      <span>Status: <span className="font-medium text-gray-900">{statusLabel}</span></span>
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                      Last updated{' '}
                      {cls.updated_at
                        ? new Date(cls.updated_at).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : cls.created_at
                        ? new Date(cls.created_at).toLocaleDateString(undefined, {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => openDetailsModal(cls)}
                      className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => onEdit(cls)}
                      className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(cls.id)}
                      className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

              </div>
            </li>
          );
        }}
      />

      {modal.type === 'class' && (
        <ClassModal isOpen onClose={closeModal} classItem={modal.data} descriptionPosition="bottom" />
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
        />
      )}
    </>
  );
};

export default ClassesSection;


