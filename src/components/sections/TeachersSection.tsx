import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useTeachers, useDeleteTeacher } from '../../hooks/useTeachers';
import type { ListState, SearchParams } from '../../types/api';
import TeacherModal from '../../components/modals/TeacherModal';

const TeachersSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '' },
  });
  const [modal, setModal] = React.useState<{ type: 'teacher' | null; data?: any }>({ type: null });

  const params: SearchParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined };
  const { data: response, isLoading, error } = useTeachers(params as any);
  React.useEffect(() => { if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta })); }, [response, isLoading, error]);

  const del = useDeleteTeacher();
  const handleDelete = async (id: number) => { if (window.confirm('Delete teacher?')) await del.mutateAsync(id); };

  const open = (data?: any) => setModal({ type: 'teacher', data });
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
        title="Teachers"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        addButtonText="Add Teacher"
        searchPlaceholder="Search by name or email..."
        renderRow={(t: any, onEdit, onDelete) => (
          <li key={t.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                <p className="text-sm text-gray-500">Email: {t.email}</p>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const classRoom = t.classRoom || t.class_room;
                    const classLabel = classRoom ? `${classRoom.title || ''}${classRoom.code ? (classRoom.title ? ` (${classRoom.code})` : classRoom.code) : ''}`.trim() : (t.class_room_id ? `ID: ${t.class_room_id}` : 'N/A');
                    const companyLabel = t.company?.name || t.company_id || 'N/A';
                    return <>Class: {classLabel} • Company: {companyLabel}</>;
                  })()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(t)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(t.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'teacher' && (
        <TeacherModal isOpen onClose={close} teacher={modal.data} />
      )}
    </>
  );
};

export default TeachersSection;
