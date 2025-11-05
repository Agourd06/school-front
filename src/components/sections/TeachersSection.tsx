import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useTeachers, useUpdateTeacher } from '../../hooks/useTeachers';
import type { ListState } from '../../types/api';
import type { GetAllTeachersParams } from '../../api/teachers';
import TeacherModal from '../../components/modals/TeacherModal';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const TeachersSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'teacher' | null; data?: any }>({ type: null });

  const params: GetAllTeachersParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useTeachers(params);
  React.useEffect(() => { if (response) setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta })); }, [response, isLoading, error]);

  const updater = useUpdateTeacher();
  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete teacher?')) return;
    await updater.mutateAsync({ id, data: { status: -2 } });
  };

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
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Teacher"
        searchPlaceholder="Search by name or email..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(t: any, onEdit, onDelete) => (
           <li key={t.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  {t.picture && (
                    <img
                      src={(t.picture?.startsWith('http') ? t.picture : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${t.picture?.startsWith('/') ? '' : '/'}${t.picture || ''}`)}
                      alt="avatar"
                      className="h-10 w-10 rounded-full object-cover border"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.first_name} {t.last_name}</p>
                    <p className="text-sm text-gray-500">Email: {t.email}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {(() => {
                    const classRoom = t.classRoom || t.class_room;
                    const classLabel = classRoom ? `${classRoom.title || ''}${classRoom.code ? (classRoom.title ? ` (${classRoom.code})` : classRoom.code) : ''}`.trim() : (t.class_room_id ? `ID: ${t.class_room_id}` : 'N/A');
                    const companyLabel = t.company?.name || t.company_id || 'N/A';
                    return <>Class: {classLabel} • Company: {companyLabel}</>;
                  })()}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Status:</span>
                  <StatusBadge value={t.status} />
                </div>
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
