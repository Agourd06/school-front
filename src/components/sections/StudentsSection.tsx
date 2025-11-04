import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useStudents, useDeleteStudent } from '../../hooks/useStudents';
import type { ListState } from '../../types/api';
import type { GetAllStudentsParams } from '../../api/students';
import { StudentModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const StudentsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'student' | null; data?: any }>({ type: null });

  const params: GetAllStudentsParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useStudents(params);
  React.useEffect(() => {
    if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta }));
  }, [response, isLoading, error]);

  const del = useDeleteStudent();
  const handleDelete = async (id: number) => { if (window.confirm('Delete student?')) await del.mutateAsync(id); };

  const open = (data?: any) => setModal({ type: 'student', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => {
      const prevSearch = (prev.filters as any).search ?? '';
      if (prevSearch === (q ?? '')) return prev;
      return { ...prev, filters: { ...prev.filters, search: q }, pagination: { ...prev.pagination, page: 1 } };
    });
  }, []);

  return (
    <>
      <DataTableGeneric
        title="Students"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Student"
        searchPlaceholder="Search by student name..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(student: any, onEdit, onDelete, index) => (
          <li key={student?.id ?? `student-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</p>
                <p className="text-sm text-gray-500">Email: {student.email}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={student.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(student)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(student.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'student' && (
        <StudentModal isOpen onClose={close} student={modal.data} />
      )}
    </>
  );
};

export default StudentsSection;
