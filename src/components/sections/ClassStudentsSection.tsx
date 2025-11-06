import React, { useCallback, useMemo } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { ListState } from '../../types/api';
import { STATUS_OPTIONS } from '../../constants/status';
import StatusBadge from '../../components/StatusBadge';
import { useClassStudents, useDeleteClassStudent } from '../../hooks/useClassStudents';
import { ClassStudentModal, DeleteModal, DescriptionModal } from '../modals';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { useClasses } from '../../hooks/useClasses';
import { useStudents } from '../../hooks/useStudents';
import { useCompanies } from '../../hooks/useCompanies';
import type { ClassStudentAssignment, GetClassStudentParams } from '../../api/classStudent';

const ClassStudentsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'assignment' | null; data?: ClassStudentAssignment | null }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; title?: string } | null>(null);
  const [detailTarget, setDetailTarget] = React.useState<ClassStudentAssignment | null>(null);

  const [classFilter, setClassFilter] = React.useState<number | ''>('');
  const [studentFilter, setStudentFilter] = React.useState<number | ''>('');
  const [companyFilter, setCompanyFilter] = React.useState<number | ''>('');

  const params: GetClassStudentParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
    class_id: classFilter === '' ? undefined : Number(classFilter),
    student_id: studentFilter === '' ? undefined : Number(studentFilter),
    company_id: companyFilter === '' ? undefined : Number(companyFilter),
  };

  const { data: response, isLoading, error } = useClassStudents(params);

  React.useEffect(() => {
    if (response) {
      setState((prev) => ({
        ...prev,
        data: response.data,
        loading: isLoading,
        error: (error as any)?.message || null,
        pagination: response.meta,
      }));
    }
  }, [response, isLoading, error]);

  const { data: classesResp, isLoading: classesLoading } = useClasses({ page: 1, limit: 100 } as any);
  const classOptions: SearchSelectOption[] = useMemo(
    () => (((classesResp as any)?.data) || [])
      .filter((cls: any) => cls?.status !== -2)
      .map((cls: any) => ({ value: cls.id, label: cls.title || `Class #${cls.id}` })),
    [classesResp]
  );
  const classLabelMap = useMemo(() => new Map(classOptions.map((opt) => [Number(opt.value), opt.label])), [classOptions]);

  const { data: studentsResp, isLoading: studentsLoading } = useStudents({ page: 1, limit: 100 } as any);
  const studentOptions: SearchSelectOption[] = useMemo(
    () => (((studentsResp as any)?.data) || [])
      .filter((stu: any) => stu?.status !== -2)
      .map((stu: any) => {
        const fullName = `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim();
        return { value: stu.id, label: fullName || stu.email || `Student #${stu.id}` };
      }),
    [studentsResp]
  );
  const studentLabelMap = useMemo(() => new Map(studentOptions.map((opt) => [Number(opt.value), opt.label])), [studentOptions]);

  const { data: companiesResp, isLoading: companiesLoading } = useCompanies({ page: 1, limit: 100 } as any);
  const companyOptions: SearchSelectOption[] = useMemo(
    () => (((companiesResp as any)?.data) || [])
      .filter((company: any) => company?.status !== -2)
      .map((company: any) => ({
        value: company.id,
        label: company.title || company.name || `Company #${company.id}`,
      })),
    [companiesResp]
  );
  const companyLabelMap = useMemo(() => new Map(companyOptions.map((opt) => [Number(opt.value), opt.label])), [companyOptions]);

  const deleteMut = useDeleteClassStudent();

  const handleSearch = useCallback((query: string) => {
    setState((prev) => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (query ?? '')) return prev;
      return {
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 },
      };
    });
  }, []);

  const requestDelete = (id: number) => {
    const found = state.data.find((item: ClassStudentAssignment) => item.id === id);
    if (!found) return;
    setDeleteTarget({ id, title: found.title });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (data?: ClassStudentAssignment | null) => setModal({ type: 'assignment', data: data ?? null });
  const closeModal = () => setModal({ type: null });

  return (
    <>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <SearchSelect
          label="Class"
          value={classFilter}
          onChange={(value) => {
            setClassFilter(value === '' ? '' : Number(value));
            setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          options={classOptions}
          placeholder="All classes"
          isClearable
          isLoading={classesLoading}
        />
        <SearchSelect
          label="Student"
          value={studentFilter}
          onChange={(value) => {
            setStudentFilter(value === '' ? '' : Number(value));
            setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          options={studentOptions}
          placeholder="All students"
          isClearable
          isLoading={studentsLoading}
        />
        <SearchSelect
          label="Company"
          value={companyFilter}
          onChange={(value) => {
            setCompanyFilter(value === '' ? '' : Number(value));
            setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page: 1 } }));
          }}
          options={companyOptions}
          placeholder="All companies"
          isClearable
          isLoading={companiesLoading}
        />
      </div>

      <DataTableGeneric
        title="Class Assignments"
        state={state}
        onAdd={() => openModal(null)}
        onEdit={(item) => openModal(item as ClassStudentAssignment)}
        onDelete={requestDelete}
        onPageChange={(page) => setState((prev) => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState((prev) => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState((prev) => ({
          ...prev,
          filters: { ...prev.filters, status },
          pagination: { ...prev.pagination, page: 1 },
        }))}
        addButtonText="Assign Student"
        searchPlaceholder="Search assignments..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(assignment: ClassStudentAssignment, onEdit, onDelete, index) => {
          const classLabel = assignment.class?.title || classLabelMap.get(assignment.class_id) || `Class #${assignment.class_id}`;
          const studentLabel = assignment.student?.first_name || assignment.student?.last_name
            ? `${assignment.student?.first_name ?? ''} ${assignment.student?.last_name ?? ''}`.trim()
            : studentLabelMap.get(assignment.student_id) || `Student #${assignment.student_id}`;
          const studentDisplay = studentLabel || assignment.student?.email;
          const companyLabel = assignment.company?.title || assignment.company?.name || (assignment.company_id ? companyLabelMap.get(assignment.company_id) : '—');

          return (
            <li key={assignment?.id ?? `assignment-${index}`} className="px-4 py-4 sm:px-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-500">Class: {classLabel}</p>
                  <p className="text-sm text-gray-500">Student: {studentDisplay}</p>
                  <p className="text-sm text-gray-500">Company: {companyLabel || '—'}</p>
                  <p className="text-sm text-gray-500">
                    Status: <StatusBadge value={assignment.status} />
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setDetailTarget(assignment)} className="text-gray-600 hover:text-gray-900">
                    Details
                  </button>
                  <button onClick={() => onEdit(assignment)} className="text-blue-600 hover:text-blue-900">
                    Edit
                  </button>
                  <button onClick={() => onDelete(assignment.id)} className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          );
        }}
      />

      {modal.type === 'assignment' && (
        <ClassStudentModal isOpen onClose={closeModal} assignment={modal.data ?? undefined} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Assignment"
        entityName={deleteTarget?.title}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMut.isPending}
      />

      {detailTarget && (
        <DescriptionModal
          isOpen
          onClose={() => setDetailTarget(null)}
          title={detailTarget.title}
          description={detailTarget.description ?? ''}
          type="class assignment"
        />
      )}
    </>
  );
};

export default ClassStudentsSection;


