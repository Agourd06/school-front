import React, { useCallback, useMemo } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { FilterParams, ListState } from '../../types/api';
import { useClasses, useUpdateClass } from '../../hooks/useClasses';
import { usePrograms } from '../../hooks/usePrograms';
import { useSpecializations } from '../../hooks/useSpecializations';
import { useLevels } from '../../hooks/useLevels';
import { useSchoolYears } from '../../hooks/useSchoolYears';
import { useSchoolYearPeriods } from '../../hooks/useSchoolYearPeriods';
import { ClassModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import SearchSelect from '../inputs/SearchSelect';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS } from '../../constants/status';

const ClassesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'class' | null; data?: any }>({ type: null });

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

  const { data: response, isLoading, error } = useClasses(params as any);

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

  const updater = useUpdateClass();
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete class?')) return;
    await updater.mutateAsync({ id, data: { status: -2 } });
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

  const handleProgramFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setProgramFilter(numeric);
    setSpecializationFilter('');
    setLevelFilter('');
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  const handleSpecializationFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setSpecializationFilter(numeric);
    setLevelFilter('');
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  const handleLevelFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setLevelFilter(numeric);
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  const handleSchoolYearFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setSchoolYearFilter(numeric);
    setPeriodFilter('');
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

  const handlePeriodFilter = (value: string) => {
    const numeric = value ? Number(value) : '';
    setPeriodFilter(numeric);
    setState(prev => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
  };

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
          placeholder={schoolYearFilter ? 'All periods' : 'Select a school year first'}
          options={periodOptions}
          isClearable
          disabled={!schoolYearFilter}
          isLoading={periodsLoading}
          error={periodsError ? 'Failed to load periods' : null}
        />
      </div>

      <DataTableGeneric
        title="Classes"
        state={state}
        onAdd={() => openModal(null)}
        onEdit={(item) => openModal(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Class"
        searchPlaceholder="Search by class title..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(cls: any, onEdit, onDelete, index) => (
          <li key={cls?.id ?? `class-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{cls.title}</p>
                <p className="text-sm text-gray-500">Program: {cls.program?.title || programs.find(p => p.id === cls.program_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Specialization: {cls.specialization?.title || specializations.find(s => s.id === cls.specialization_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Level: {cls.level?.title || levels.find(l => l.id === cls.level_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">School Year: {cls.schoolYear?.title || schoolYears.find(y => y.id === cls.school_year_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Period: {cls.schoolYearPeriod?.title || periods.find(p => p.id === cls.school_year_period_id)?.title || '—'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={cls.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(cls)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(cls.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'class' && (
        <ClassModal isOpen onClose={closeModal} classItem={modal.data} />
      )}
    </>
  );
};

export default ClassesSection;


