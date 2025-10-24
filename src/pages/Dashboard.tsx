import React, { useState, useCallback } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { useDeleteCompany } from '../hooks/useCompanies';
import { useCourses, useDeleteCourse } from '../hooks/useCourses';
import { useModules, useDeleteModule } from '../hooks/useModules';
import { UserModal, CourseModal, ModuleModal, DescriptionModal, CourseAssignmentModal, ModuleAssignmentModal } from '../components/modals';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/DataTable';
import type { ListState, SearchParams, FilterParams } from '../types/api';

// Main Dashboard component with reusable DataTable
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'modules'>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);
  const [showCourseAssignmentModal, setShowCourseAssignmentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showModuleAssignmentModal, setShowModuleAssignmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // State for each tab's pagination and filtering
  const [usersState, setUsersState] = useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    },
    filters: {
      search: ''
    }
  });

  const [coursesState, setCoursesState] = useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    },
    filters: {
      search: '',
      status: undefined
    }
  });

  const [modulesState, setModulesState] = useState<ListState<any>>({
    data: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    },
    filters: {
      search: '',
      status: undefined
    }
  });

  // Helper function to get status display
  const getStatusDisplay = (status: number) => {
    const statusMap = {
      1: { label: 'Active', className: 'bg-green-100 text-green-800' },
      2: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      0: { label: 'Disabled', className: 'bg-gray-100 text-gray-800' },
      [-1]: { label: 'Archived', className: 'bg-blue-100 text-blue-800' },
      [-2]: { label: 'Deleted', className: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Data fetching with pagination and filtering
  const usersParams: SearchParams = {
    page: usersState.pagination.page,
    limit: usersState.pagination.limit,
    search: usersState.filters.search || undefined
  };
  const { data: usersResponse, isLoading: usersLoading, error: usersError } = useUsers(usersParams);

  const coursesParams: FilterParams = {
    page: coursesState.pagination.page,
    limit: coursesState.pagination.limit,
    search: coursesState.filters.search || undefined,
    status: coursesState.filters.status
  };
  const { data: coursesResponse, isLoading: coursesLoading, error: coursesError } = useCourses(coursesParams);

  const modulesParams: FilterParams = {
    page: modulesState.pagination.page,
    limit: modulesState.pagination.limit,
    search: modulesState.filters.search || undefined,
    status: modulesState.filters.status
  };
  const { data: modulesResponse, isLoading: modulesLoading, error: modulesError } = useModules(modulesParams);

  // Update state when API responses change
  React.useEffect(() => {
    if (usersResponse) {
      setUsersState(prev => ({
        ...prev,
        data: usersResponse.data,
        loading: usersLoading,
        error: usersError?.message || null,
        pagination: usersResponse.meta
      }));
    }
  }, [usersResponse, usersLoading, usersError]);

  React.useEffect(() => {
    if (coursesResponse) {
      setCoursesState(prev => ({
        ...prev,
        data: coursesResponse.data,
        loading: coursesLoading,
        error: coursesError?.message || null,
        pagination: coursesResponse.meta
      }));
    }
  }, [coursesResponse, coursesLoading, coursesError]);

  React.useEffect(() => {
    if (modulesResponse) {
      setModulesState(prev => ({
        ...prev,
        data: modulesResponse.data,
        loading: modulesLoading,
        error: modulesError?.message || null,
        pagination: modulesResponse.meta
      }));
    }
  }, [modulesResponse, modulesLoading, modulesError]);

  // Create mutations
  // const createUser = useCreateUser();
  // const createCompany = useCreateCompany();
  // const createCourse = useCreateCourse();
  // const createModule = useCreateModule();

  // Update mutations
  // const updateUser = useUpdateUser();
  // const updateCompany = useUpdateCompany();
  // const updateCourse = useUpdateCourse();
  // const updateModule = useUpdateModule();

  // Delete mutations
  const deleteUser = useDeleteUser();
  const deleteCompany = useDeleteCompany();
  const deleteCourse = useDeleteCourse();
  const deleteModule = useDeleteModule();

  const handleDelete = async (id: number, type: 'user' | 'company' | 'course' | 'module') => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        console.log(`Deleting ${type} with id:`, id);
        
        if (type === 'user') {
          await deleteUser.mutateAsync(id);
          console.log('User deleted successfully');
        } else if (type === 'company') {
          await deleteCompany.mutateAsync(id);
          console.log('Company deleted successfully');
        } else if (type === 'course') {
          await deleteCourse.mutateAsync(id);
          console.log('Course deleted successfully');
        } else if (type === 'module') {
          await deleteModule.mutateAsync(id);
          console.log('Module deleted successfully');
        }
      } catch (error) {
        console.error(`Delete failed for ${type}:`, error);
        alert(`Failed to delete ${type}. Please try again.`);
      }
    }
  };


  // const renderCompaniesTable = () => (
  //   <div className="bg-white shadow overflow-hidden sm:rounded-md">
  //     <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
  //       <h3 className="text-lg leading-6 font-medium text-gray-900">Companies</h3>
  //       <button
  //         onClick={handleAddClick}
  //         className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
  //       >
  //         Add Company
  //       </button>
  //     </div>
  //     {companiesLoading ? (
  //       <div className="p-4 text-center">Loading...</div>
  //     ) : (
  //       <ul className="divide-y divide-gray-200">
  //         {companies?.map((company) => (
  //           <li key={company.id} className="px-4 py-4 sm:px-6">
  //             <div className="flex items-center justify-between">
  //               <div>
  //                 <p className="text-sm font-medium text-gray-900">{company.name}</p>
  //                 <p className="text-sm text-gray-500">{company.email}</p>
  //                 <p className="text-sm text-gray-500">Phone: {company.phone || 'N/A'}</p>
  //                 <p className="text-sm text-gray-500">Website: {company.website || 'N/A'}</p>
  //               </div>
  //               <div className="flex space-x-2">
  //                 <button
  //                   onClick={() => handleEditClick(company)}
  //                   className="text-blue-600 hover:text-blue-900"
  //                 >
  //                   Edit
  //                 </button>
  //                 <button
  //                   onClick={() => handleDelete(company.id, 'company')}
  //                   className="text-red-600 hover:text-red-900"
  //                 >
  //                   Delete
  //                 </button>
  //               </div>
  //             </div>
  //           </li>
  //         ))}
  //       </ul>
  //     )}
  //   </div>
  // );



  const handleAddClick = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDescriptionClick = (item: any) => {
    setDescriptionItem(item);
    setShowDescriptionModal(true);
  };

  const handleDescriptionModalClose = () => {
    setShowDescriptionModal(false);
    setDescriptionItem(null);
  };

  const handleCourseAssignmentClick = (module: any) => {
    setSelectedModule(module);
    setShowCourseAssignmentModal(true);
  };

  const handleCourseAssignmentModalClose = () => {
    setShowCourseAssignmentModal(false);
    setSelectedModule(null);
  };

  const handleModuleAssignmentClick = (course: any) => {
    setSelectedCourse(course);
    setShowModuleAssignmentModal(true);
  };

  const handleModuleAssignmentModalClose = () => {
    setShowModuleAssignmentModal(false);
    setSelectedCourse(null);
  };

  // Event handlers for pagination, search, and filtering
  const handleUsersPageChange = useCallback((page: number) => {
    setUsersState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  const handleUsersPageSizeChange = useCallback((size: number) => {
    setUsersState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, limit: size, page: 1 }
    }));
  }, []);

  const handleUsersSearch = useCallback((query: string) => {
    setUsersState(prev => ({
      ...prev,
      filters: { ...prev.filters, search: query },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleCoursesPageChange = useCallback((page: number) => {
    setCoursesState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  const handleCoursesPageSizeChange = useCallback((size: number) => {
    setCoursesState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, limit: size, page: 1 }
    }));
  }, []);

  const handleCoursesSearch = useCallback((query: string) => {
    setCoursesState(prev => ({
      ...prev,
      filters: { ...prev.filters, search: query },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleCoursesFilterChange = useCallback((status: number | null) => {
    setCoursesState(prev => ({
      ...prev,
      filters: { ...prev.filters, status },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleModulesPageChange = useCallback((page: number) => {
    setModulesState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, page }
    }));
  }, []);

  const handleModulesPageSizeChange = useCallback((size: number) => {
    setModulesState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, limit: size, page: 1 }
    }));
  }, []);

  const handleModulesSearch = useCallback((query: string) => {
    setModulesState(prev => ({
      ...prev,
      filters: { ...prev.filters, search: query },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const handleModulesFilterChange = useCallback((status: number | null) => {
    setModulesState(prev => ({
      ...prev,
      filters: { ...prev.filters, status },
      pagination: { ...prev.pagination, page: 1 }
    }));
  }, []);

  const renderModal = () => {
    switch (activeTab) {
      case 'users':
        return (
          <UserModal
            isOpen={showModal}
            onClose={handleModalClose}
            user={editingItem}
          />
        );
      // case 'companies':
      //   return (
      //     <CompanyModal
      //       isOpen={showModal}
      //       onClose={handleModalClose}
      //       company={editingItem}
      //     />
      //   );
      case 'courses':
        return (
          <CourseModal
            isOpen={showModal}
            onClose={handleModalClose}
            course={editingItem}
          />
        );
      case 'modules':
        return (
          <ModuleModal
            isOpen={showModal}
            onClose={handleModalClose}
            module={editingItem}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            
            {/* Content */}
            {activeTab === 'users' && (
              <DataTable
                title="Users"
                state={usersState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onPageChange={handleUsersPageChange}
                onPageSizeChange={handleUsersPageSizeChange}
                onSearch={handleUsersSearch}
                type="users"
                getStatusDisplay={getStatusDisplay}
              />
            )}
            {activeTab === 'courses' && (
              <DataTable
                title="Courses"
                state={coursesState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onViewDescription={handleDescriptionClick}
                onManageModules={handleModuleAssignmentClick}
                onPageChange={handleCoursesPageChange}
                onPageSizeChange={handleCoursesPageSizeChange}
                onSearch={handleCoursesSearch}
                onFilterChange={handleCoursesFilterChange}
                type="courses"
                getStatusDisplay={getStatusDisplay}
              />
            )}
            {activeTab === 'modules' && (
              <DataTable
                title="Modules"
                state={modulesState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onViewDescription={handleDescriptionClick}
                onManageCourses={handleCourseAssignmentClick}
                onPageChange={handleModulesPageChange}
                onPageSizeChange={handleModulesPageSizeChange}
                onSearch={handleModulesSearch}
                onFilterChange={handleModulesFilterChange}
                type="modules"
                getStatusDisplay={getStatusDisplay}
              />
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderModal()}
      
      {/* Description Modal */}
      {descriptionItem && (
        <DescriptionModal
          isOpen={showDescriptionModal}
          onClose={handleDescriptionModalClose}
          title={descriptionItem.title}
          description={descriptionItem.description}
          type={activeTab === 'courses' ? 'course' : 'module'}
        />
      )}

      {/* Course Assignment Modal */}
      {selectedModule && (
        <CourseAssignmentModal
          isOpen={showCourseAssignmentModal}
          onClose={handleCourseAssignmentModalClose}
          moduleId={selectedModule.id}
          moduleTitle={selectedModule.title}
        />
      )}

      {/* Module Assignment Modal */}
      {selectedCourse && (
        <ModuleAssignmentModal
          isOpen={showModuleAssignmentModal}
          onClose={handleModuleAssignmentModalClose}
          courseId={selectedCourse.id}
          courseTitle={selectedCourse.title}
        />
      )}
    </div>
  );
};

export default Dashboard;
