import React, { useCallback } from 'react';
import DataTableGeneric from '../../components/DataTableGeneric';
import { useCourses, useDeleteCourse } from '../../hooks/useCourses';
import type { FilterParams, ListState } from '../../types/api';
import { CourseModal, DescriptionModal, ModuleAssignmentModal } from '../../components/modals';
import StatusBadge from '../../components/StatusBadge';

const CoursesSection: React.FC = () => {
  const [state, setState] = React.useState<ListState<any>>({
    data: [], loading: false, error: null,
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrevious: false },
    filters: { search: '', status: undefined },
  });
  const [modal, setModal] = React.useState<{ type: 'course' | 'description' | 'assign-modules' | null; data?: any }>({ type: null });

  const params: FilterParams = { page: state.pagination.page, limit: state.pagination.limit, search: state.filters.search || undefined, status: (state.filters as any).status };
  const { data: response, isLoading, error } = useCourses(params);
  React.useEffect(() => {
    if (response) {
      setState(prev => ({ ...prev, data: response.data, loading: isLoading, error: (error as any)?.message || null, pagination: response.meta }));
    }
  }, [response, isLoading, error]);

  const del = useDeleteCourse();
  const handleDelete = async (id: number) => { if (window.confirm('Delete course?')) await del.mutateAsync(id); };

  const open = (type: 'course' | 'description' | 'assign-modules', data?: any) => setModal({ type, data });
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
        title="Courses"
        state={state}
        onAdd={() => open('course', null)}
        onEdit={(item) => open('course', item)}
        onDelete={handleDelete}
        onPageChange={(page) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, page } }))}
        onPageSizeChange={(size) => setState(prev => ({ ...prev, pagination: { ...prev.pagination, limit: size, page: 1 } }))}
        onSearch={handleSearch}
        onFilterChange={(status) => setState(prev => ({ ...prev, filters: { ...prev.filters, status }, pagination: { ...prev.pagination, page: 1 } }))}
        addButtonText="Add Course"
        searchPlaceholder="Search by course title..."
        renderRow={(course: any, onEdit, onDelete, index) => (
          <li key={course?.id ?? `course-${index}`} className="px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{course.title} </p>
                <p className="text-sm text-gray-500">Volume: {course.volume || 'N/A'}</p>
                <p className="text-sm text-gray-500">Coefficient: {course.coefficient || 'N/A'}</p>
                <p className="text-sm text-gray-500">Status: <StatusBadge value={course.status} /></p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => open('description', course)} className="text-green-600 hover:text-green-900">View Description</button>
                <button onClick={() => open('assign-modules', course)} className="text-purple-600 hover:text-purple-900">Manage Modules</button>
                <button onClick={() => onEdit(course)} className="text-blue-600 hover:text-blue-900">Edit</button>
                <button onClick={() => onDelete(course.id)} className="text-red-600 hover:text-red-900">Delete</button>
              </div>
            </div>
          </li>
        )}
      />

      {modal.type === 'course' && (
        <CourseModal isOpen onClose={close} course={modal.data} />
      )}
      {modal.type === 'description' && (
        <DescriptionModal isOpen onClose={close} title={modal.data?.title} description={modal.data?.description} type="course" />
      )}
      {modal.type === 'assign-modules' && (
        <ModuleAssignmentModal isOpen onClose={close} courseId={modal.data?.id} courseTitle={modal.data?.title} />
      )}
    </>
  );
};

export default CoursesSection;
