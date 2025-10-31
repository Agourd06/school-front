import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useModules, useDeleteModule } from '../../hooks/useModules';
import type { FilterParams, ListState } from '../../types/api';
import { ModuleModal, DescriptionModal, CourseAssignmentModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';

const ModulesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'module' | 'description' | 'assign-courses' | null; data?: any }>({ type: null });

  const params: FilterParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined, status: (state.filters as any).status };
  const { data: response, isLoading, error } = useModules(params);
  React.useEffect(() => {
    if (response) {
      setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta }));
    }
  }, [response, isLoading, error]);

  const del = useDeleteModule();
  const handleDelete = async (id: number) => { if (window.confirm('Delete module?')) await del.mutateAsync(id); };

  const open = (type: 'module' | 'description' | 'assign-courses', data?: any) => setModal({ type, data });
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
        title="Modules"
        state={state}
        onAdd={() => open('module', null)}
        onEdit={(item) => open('module', item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Module"
        searchPlaceholder="Search by module title..."
        renderRow={(module: any, onEdit, onDelete, index) => (
          <li key={module?.id ?? `module-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{module.title}</p>
                <p className="text-sm text-gray-500">Volume: {module.volume || 'N/A'}</p>
                <p className="text-sm text-gray-500">Coefficient: {module.coefficient || 'N/A'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={module.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => open('description', module)} className="text-green-600 hover:text-green-900">View Description</button>
                <button onClick={() => open('assign-courses', module)} className="text-purple-600 hover:text-purple-900">Manage Courses</button>
                <button onClick={() => onEdit(module)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(module.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'module' && (
        <ModuleModal isOpen onClose={close} module={modal.data} />
      )}
      {modal.type === 'description' && (
        <DescriptionModal isOpen onClose={close} title={modal.data?.title} description={modal.data?.description} type="module" />
      )}
      {modal.type === 'assign-courses' && (
        <CourseAssignmentModal isOpen onClose={close} moduleId={modal.data?.id} moduleTitle={modal.data?.title} />
      )}
    </>
  );
};

export default ModulesSection;
