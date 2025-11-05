import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import type { ListState } from '../../types/api';
import type { GetAllStudentDiplomeParams } from '../../api/studentDiplome';
import { useStudentDiplomes, useUpdateStudentDiplome } from '../../hooks/useStudentDiplomes';
import { StudentDiplomeModal, StudentDiplomeDetailsModal, DeleteModal } from '../modals';
import StatusBadge from '../../components/StatusBadge';
import { STATUS_OPTIONS } from '../../constants/status';

const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const StudentDiplomesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'sd' | 'sd_details' | null; data?: any }>({ type: null });
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: number; name?: string } | null>(null);

  const params: GetAllStudentDiplomeParams = {
    page: state.pagination.page,
    limit: state.pagination.limit,
    search: state.filters.search || undefined,
    status: (state.filters as any).status ?? undefined,
  };
  const { data: response, isLoading, error } = useStudentDiplomes(params);

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

  const updater = useUpdateStudentDiplome();
  const performDelete = async (id: number) => {
    await updater.mutateAsync({ id, data: { status: -2 } });
  };

  const requestDelete = (id: number) => {
    const diplome = state.data.find((item: any) => item.id === id);
    if (!diplome) return;
    const name = [diplome.title, diplome.school].filter(Boolean).join(' — ');
    setDeleteTarget({ id, name: name || undefined });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await performDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    }
  };

  const open = (data?: any) => setModal({ type: 'sd', data });
  const close = () => setModal({ type: null });
  const openDetails = (data?: any) => setModal({ type: 'sd_details', data });

  const handleSearch = useCallback((q: string) => {
    setState(prev => ({ ...prev, filters: { ...prev.filters, search: q }, pagination: { ...prev.pagination, page: 1 } }));
  }, []);

  return (
    <>
      
      <DataTableGeneric
        title="Student Diplomes"
        state={state}
        onAdd={() => open(null)}
        onEdit={(item) => open(item)}
        onDelete={requestDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Diplome"
        searchPlaceholder="Search by title, school, city..."
        filterOptions={STATUS_OPTIONS}
        renderRow={(d: any, onEdit, onDelete) => (
          <li key={d.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {d.diplome_picture_1 && (
                  <img src={`${apiBase}${d.diplome_picture_1}`} alt="diplome 1" className="h-10 w-10 rounded object-cover border" />
                )}
                {d.diplome_picture_2 && (
                  <img src={`${apiBase}${d.diplome_picture_2}`} alt="diplome 2" className="h-10 w-10 rounded object-cover border" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.title} — {d.school}</p>
                  <p className="text-xs text-gray-500">{d.city || ''}{d.country ? `, ${d.country}` : ''} {d.annee ? `· ${d.annee}` : ''}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                    <span>Status:</span>
                    <StatusBadge value={d.status} />
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openDetails(d)} className="text-green-600 hover:text-green-900">Details</button>
                <button onClick={() => onEdit(d)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(d.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'sd' && (
        <StudentDiplomeModal isOpen onClose={close} item={modal.data} />
      )}
      {modal.type === 'sd_details' && (
        <StudentDiplomeDetailsModal isOpen onClose={close} item={modal.data} />
      )}

      <DeleteModal
        isOpen={!!deleteTarget}
        title="Delete Diplome"
        entityName={deleteTarget?.name}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={updater.isPending}
      />
    </>
  );
};

export default StudentDiplomesSection;


