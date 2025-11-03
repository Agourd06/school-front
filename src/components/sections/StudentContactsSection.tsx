import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { ListState } from '../../types/api';
import { useStudentContacts, useDeleteStudentContact } from '../../hooks/useStudentContacts';
import { StudentContactModal } from '../modals';

const StudentContactsSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '' },
  });
  const [modal, setModal] = React.useState<{ type: 'sc' | null; data?: any }>({ type: null });

  const params = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined } as any;
  const { data: response, isLoading, error } = useStudentContacts(params);

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

  const del = useDeleteStudentContact();
  const handleDelete = async (id: number) => { if (window.confirm('Delete contact?')) await del.mutateAsync(id); };

  const open = (data?: any) => setModal({ type: 'sc', data });
  const close = () => setModal({ type: null });

  const handleSearch = useCallback((q: string) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, search: q }, pagination: { ...prev.pagination, page: 1 } }));
  }, []);

  return (
    <>
      <DataTableGeneric
        title="Student Contacts"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        addButtonText="Add Contact"
        searchPlaceholder="Search by name, email, or phone..."
        renderRow={(c: any, onEdit, onDelete) => (
          <li key={c.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm font-medium text-gray-900">{c.firstname} {c.lastname}</p>
                <p className="text-sm text-gray-500">{c.email || '—'} · {c.phone || '—'}</p>
                <p className="text-xs text-gray-500">{c.city || ''} {c.country ? `(${c.country})` : ''}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(c.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'sc' && (
        <StudentContactModal isOpen onClose={close} item={modal.data} />
      )}
    </>
  );
};

export default StudentContactsSection;


