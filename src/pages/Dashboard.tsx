import React, { useState, useCallback } from 'react';
import {
  useUsers,
  useDeleteUser
} from '../hooks/useUsers';
import { useDeleteCompany } from '../hooks/useCompanies';
import {
  useCourses,
  useDeleteCourse
} from '../hooks/useCourses';
import {
  useModules,
  useDeleteModule
} from '../hooks/useModules';
import {
  useSchoolYears,
  useDeleteSchoolYear
} from '../hooks/useSchoolYears';
import useSchoolYearPeriods, { useDeleteSchoolYearPeriod } from '../hooks/useSchoolYearPeriods';
import { useClassRooms, useDeleteClassRoom } from '../hooks/useClassRooms';
import { useStudents, useDeleteStudent } from '../hooks/useStudents';
import {
  UserModal,
  CourseModal,
  ModuleModal,
  DescriptionModal,
  CourseAssignmentModal,
  ModuleAssignmentModal,
  SchoolYearPeriodModal,
  ClassRoomModal,
  StudentModal,
  
} from '../components/modals';
import Sidebar from '../components/Sidebar';
import DataTable from '../components/DataTable';
import type { ListState, SearchParams, FilterParams } from '../types/api';
import type { GetAllSchoolYearsParams } from '../api/schoolYear';
import SchoolYearModal from '../components/modals/SchoolYearModal';

// Main Dashboard component with reusable DataTable
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'users' | 'courses' | 'modules' | 'schoolYears' | 'schoolYearPeriods' | 'classRooms' | 'students'
  >('users');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);
  const [showCourseAssignmentModal, setShowCourseAssignmentModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [showModuleAssignmentModal, setShowModuleAssignmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

  // --- States ---
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

  const [schoolYearsState, setSchoolYearsState] = useState<ListState<any>>({
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

  const [schoolYearPeriodsState, setSchoolYearPeriodsState] = useState<ListState<any>>({
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

  const [classRoomsState, setClassRoomsState] = useState<ListState<any>>({
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
    }
  });

  const [studentsState, setStudentsState] = useState<ListState<any>>({
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
    }
  });

  // --- Helper for displaying status ---
  const getStatusDisplay = (status: number) => {
    const statusMap = {
      1: { label: 'Active', className: 'bg-green-100 text-green-800' },
      2: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      0: { label: 'Disabled', className: 'bg-gray-100 text-gray-800' },
      [-1]: { label: 'Archived', className: 'bg-blue-100 text-blue-800' },
      [-2]: { label: 'Deleted', className: 'bg-red-100 text-red-800' }
    };
    const statusInfo =
      statusMap[status as keyof typeof statusMap] ||
      { label: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  // --- Data fetching ---
  const usersParams: SearchParams = {
    page: usersState.pagination.page,
    limit: usersState.pagination.limit,
    search: usersState.filters.search || undefined
  };
  const { data: usersResponse, isLoading: usersLoading, error: usersError } =
    useUsers(usersParams);

  const coursesParams: FilterParams = {
    page: coursesState.pagination.page,
    limit: coursesState.pagination.limit,
    search: coursesState.filters.search || undefined,
    status: coursesState.filters.status
  };
  const { data: coursesResponse, isLoading: coursesLoading, error: coursesError } =
    useCourses(coursesParams);

  const modulesParams: FilterParams = {
    page: modulesState.pagination.page,
    limit: modulesState.pagination.limit,
    search: modulesState.filters.search || undefined,
    status: modulesState.filters.status
  };
  const { data: modulesResponse, isLoading: modulesLoading, error: modulesError } =
    useModules(modulesParams);

  const schoolYearsParams: GetAllSchoolYearsParams = {
    page: schoolYearsState.pagination.page,
    limit: schoolYearsState.pagination.limit,
    search: schoolYearsState.filters.search || undefined,
    status: schoolYearsState.filters.status === null ? undefined : schoolYearsState.filters.status
  };
  const {
    data: schoolYearsResponse,
    isLoading: schoolYearsLoading,
    error: schoolYearsError
  } = useSchoolYears(schoolYearsParams);

  const schoolYearPeriodsParams: FilterParams = {
    page: schoolYearPeriodsState.pagination.page,
    limit: schoolYearPeriodsState.pagination.limit,
    search: schoolYearPeriodsState.filters.search || undefined,
    status: schoolYearPeriodsState.filters.status
  };
  const {
    data: schoolYearPeriodsResponse,
    isLoading: schoolYearPeriodsLoading,
    error: schoolYearPeriodsError
  } = useSchoolYearPeriods(schoolYearPeriodsParams);

  const classRoomsParams: SearchParams = {
    page: classRoomsState.pagination.page,
    limit: classRoomsState.pagination.limit,
    search: classRoomsState.filters.search || undefined,
  };
  const { data: classRoomsResponse, isLoading: classRoomsLoading, error: classRoomsError } = useClassRooms(classRoomsParams as any);

  const studentsParams: SearchParams = {
    page: studentsState.pagination.page,
    limit: studentsState.pagination.limit,
    search: studentsState.filters.search || undefined,
  };
  const { data: studentsResponse, isLoading: studentsLoading, error: studentsError } = useStudents(studentsParams as any);

  // --- Update states from responses ---
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

  React.useEffect(() => {
    if (schoolYearsResponse) {
      setSchoolYearsState(prev => ({
        ...prev,
        data: schoolYearsResponse.data,
        loading: schoolYearsLoading,
        error: schoolYearsError?.message || null,
        pagination: {
          page: schoolYearsResponse.meta.page,
          limit: schoolYearsResponse.meta.limit,
          total: schoolYearsResponse.meta.total,
          totalPages:
            schoolYearsResponse.meta.totalPages ?? schoolYearsResponse.meta.lastPage ?? 0,
          hasNext: schoolYearsResponse.meta.hasNext ?? false,
          hasPrevious: schoolYearsResponse.meta.hasPrevious ?? false,
        },
      }));
    }
  }, [schoolYearsResponse, schoolYearsLoading, schoolYearsError]);

  React.useEffect(() => {
    if (schoolYearPeriodsResponse) {
      setSchoolYearPeriodsState(prev => ({
        ...prev,
        data: schoolYearPeriodsResponse.data,
        loading: schoolYearPeriodsLoading,
        error: (schoolYearPeriodsError as any)?.message || null,
        pagination: {
          page: schoolYearPeriodsResponse.meta.page,
          limit: schoolYearPeriodsResponse.meta.limit,
          total: schoolYearPeriodsResponse.meta.total,
          totalPages:
            (schoolYearPeriodsResponse.meta as any).totalPages ?? (schoolYearPeriodsResponse.meta as any).lastPage ?? 0,
          hasNext: (schoolYearPeriodsResponse.meta as any).hasNext ?? (schoolYearPeriodsResponse.meta.page < ((schoolYearPeriodsResponse.meta as any).totalPages ?? (schoolYearPeriodsResponse.meta as any).lastPage ?? 1)),
          hasPrevious: (schoolYearPeriodsResponse.meta as any).hasPrevious ?? (schoolYearPeriodsResponse.meta.page > 1),
        },
      }));
    }
  }, [schoolYearPeriodsResponse, schoolYearPeriodsLoading, schoolYearPeriodsError]);

  React.useEffect(() => {
    if (classRoomsResponse) {
      setClassRoomsState(prev => ({
        ...prev,
        data: classRoomsResponse.data,
        loading: classRoomsLoading,
        error: (classRoomsError as any)?.message || null,
        pagination: classRoomsResponse.meta,
      }));
    }
  }, [classRoomsResponse, classRoomsLoading, classRoomsError]);

  React.useEffect(() => {
    if (studentsResponse) {
      setStudentsState(prev => ({
        ...prev,
        data: studentsResponse.data,
        loading: studentsLoading,
        error: (studentsError as any)?.message || null,
        pagination: studentsResponse.meta,
      }));
    }
  }, [studentsResponse, studentsLoading, studentsError]);

  // --- Delete Mutations ---
  const deleteUser = useDeleteUser();
  const deleteCompany = useDeleteCompany();
  const deleteCourse = useDeleteCourse();
  const deleteModule = useDeleteModule();
  const deleteSchoolYear = useDeleteSchoolYear();
  const deleteSchoolYearPeriod = useDeleteSchoolYearPeriod();
  const deleteClassRoom = useDeleteClassRoom();
  const deleteStudent = useDeleteStudent();

  const handleDelete = async (
    id: number,
    type: 'user' | 'company' | 'course' | 'module' | 'schoolYear' | 'schoolYearPeriod' | 'classRoom' | 'student'
  ) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        console.log(`Deleting ${type} with id:`, id);

        if (type === 'user') await deleteUser.mutateAsync(id);
        else if (type === 'company') await deleteCompany.mutateAsync(id);
        else if (type === 'course') await deleteCourse.mutateAsync(id);
        else if (type === 'module') await deleteModule.mutateAsync(id);
        else if (type === 'schoolYear') await deleteSchoolYear.mutateAsync(id);
        else if (type === 'schoolYearPeriod') await deleteSchoolYearPeriod.mutateAsync(id);
        else if (type === 'classRoom') await deleteClassRoom.mutateAsync(id);
        else if (type === 'student') await deleteStudent.mutateAsync(id);

        console.log(`${type} deleted successfully`);
      } catch (error) {
        console.error(`Delete failed for ${type}:`, error);
        alert(`Failed to delete ${type}. Please try again.`);
      }
    }
  };

  // --- UI Event Handlers ---
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

  // --- Pagination, Search, Filters (reusable pattern) ---
  const handleUsersPageChange = useCallback(
    (page: number) =>
      setUsersState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleUsersPageSizeChange = useCallback(
    (size: number) =>
      setUsersState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleUsersSearch = useCallback(
    (query: string) =>
      setUsersState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleCoursesPageChange = useCallback(
    (page: number) =>
      setCoursesState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleCoursesPageSizeChange = useCallback(
    (size: number) =>
      setCoursesState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleCoursesSearch = useCallback(
    (query: string) =>
      setCoursesState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleCoursesFilterChange = useCallback(
    (status: number | null) =>
      setCoursesState(prev => ({
        ...prev,
        filters: { ...prev.filters, status },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleModulesPageChange = useCallback(
    (page: number) =>
      setModulesState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleModulesPageSizeChange = useCallback(
    (size: number) =>
      setModulesState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleModulesSearch = useCallback(
    (query: string) =>
      setModulesState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleModulesFilterChange = useCallback(
    (status: number | null) =>
      setModulesState(prev => ({
        ...prev,
        filters: { ...prev.filters, status },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleSchoolYearsPageChange = useCallback(
    (page: number) =>
      setSchoolYearsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleSchoolYearsPageSizeChange = useCallback(
    (size: number) =>
      setSchoolYearsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleSchoolYearsSearch = useCallback(
    (query: string) =>
      setSchoolYearsState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleSchoolYearsFilterChange = useCallback(
    (status: number | null) =>
      setSchoolYearsState(prev => ({
        ...prev,
        filters: { ...prev.filters, status },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleSchoolYearPeriodsPageChange = useCallback(
    (page: number) =>
      setSchoolYearPeriodsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleSchoolYearPeriodsPageSizeChange = useCallback(
    (size: number) =>
      setSchoolYearPeriodsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleSchoolYearPeriodsSearch = useCallback(
    (query: string) =>
      setSchoolYearPeriodsState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleSchoolYearPeriodsFilterChange = useCallback(
    (status: number | null) =>
      setSchoolYearPeriodsState(prev => ({
        ...prev,
        filters: { ...prev.filters, status },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleClassRoomsPageChange = useCallback(
    (page: number) =>
      setClassRoomsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleClassRoomsPageSizeChange = useCallback(
    (size: number) =>
      setClassRoomsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleClassRoomsSearch = useCallback(
    (query: string) =>
      setClassRoomsState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  const handleStudentsPageChange = useCallback(
    (page: number) =>
      setStudentsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, page }
      })),
    []
  );

  const handleStudentsPageSizeChange = useCallback(
    (size: number) =>
      setStudentsState(prev => ({
        ...prev,
        pagination: { ...prev.pagination, limit: size, page: 1 }
      })),
    []
  );

  const handleStudentsSearch = useCallback(
    (query: string) =>
      setStudentsState(prev => ({
        ...prev,
        filters: { ...prev.filters, search: query },
        pagination: { ...prev.pagination, page: 1 }
      })),
    []
  );

  // --- Modals rendering ---
  const renderModal = () => {
    switch (activeTab) {
      case 'users':
        return <UserModal isOpen={showModal} onClose={handleModalClose} user={editingItem} />;
      case 'courses':
        return <CourseModal isOpen={showModal} onClose={handleModalClose} course={editingItem} />;
      case 'modules':
        return <ModuleModal isOpen={showModal} onClose={handleModalClose} module={editingItem} />;
      case 'schoolYears':
        return (
          <SchoolYearModal
            isOpen={showModal}
            onClose={handleModalClose}
            schoolYear={editingItem}
          />
        );
      case 'schoolYearPeriods':
        return (
          <SchoolYearPeriodModal
            isOpen={showModal}
            onClose={handleModalClose}
            period={editingItem}
          />
        );
      case 'classRooms':
        return (
          <ClassRoomModal
            isOpen={showModal}
            onClose={handleModalClose}
            classRoom={editingItem}
          />
        );
      case 'students':
        return (
          <StudentModal
            isOpen={showModal}
            onClose={handleModalClose}
            student={editingItem}
          />
        );
      default:
        return null;
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

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

            {activeTab === 'schoolYears' && (
              <DataTable
                title="School Years"
                state={schoolYearsState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onPageChange={handleSchoolYearsPageChange}
                onPageSizeChange={handleSchoolYearsPageSizeChange}
                onSearch={handleSchoolYearsSearch}
                onFilterChange={handleSchoolYearsFilterChange}
                type="schoolYears"
                getStatusDisplay={getStatusDisplay}
              />
            )}

            {activeTab === 'schoolYearPeriods' && (
              <DataTable
                title="School Year Periods"
                state={schoolYearPeriodsState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onPageChange={handleSchoolYearPeriodsPageChange}
                onPageSizeChange={handleSchoolYearPeriodsPageSizeChange}
                onSearch={handleSchoolYearPeriodsSearch}
                onFilterChange={handleSchoolYearPeriodsFilterChange}
                type="schoolYearPeriods"
                getStatusDisplay={getStatusDisplay}
              />
            )}

            {activeTab === 'classRooms' && (
              <DataTable
                title="Class Rooms"
                state={classRoomsState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onPageChange={handleClassRoomsPageChange}
                onPageSizeChange={handleClassRoomsPageSizeChange}
                onSearch={handleClassRoomsSearch}
                type="classRooms"
                getStatusDisplay={getStatusDisplay}
              />
            )}

            {activeTab === 'students' && (
              <DataTable
                title="Students"
                state={studentsState}
                onAdd={handleAddClick}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onPageChange={handleStudentsPageChange}
                onPageSizeChange={handleStudentsPageSizeChange}
                onSearch={handleStudentsSearch}
                type="students"
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
