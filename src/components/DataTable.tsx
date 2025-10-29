import React from 'react';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import FilterDropdown from './FilterDropdown';
import type { ListState } from '../types/api';

// Reusable DataTable component for displaying different types of data
interface DataTableProps {
  title: string;
  state: ListState<any>;
  onAdd: () => void;
  onEdit: (item: any) => void;
  onDelete: (id: number, type: 'user' | 'company' | 'course' | 'module' | 'schoolYear' | 'schoolYearPeriod' | 'classRoom' | 'student') => Promise<void>;
  onViewDescription?: (item: any) => void;
  onManageCourses?: (item: any) => void;
  onManageModules?: (item: any) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (query: string) => void;
  onFilterChange?: (status: number | null) => void;
  type: 'users' | 'courses' | 'modules' | 'schoolYearPeriods' | 'schoolYears' | 'classRooms' | 'students';
  getStatusDisplay: (status: number) => React.ReactNode;
}

const DataTable: React.FC<DataTableProps> = ({
  title,
  state,
  onAdd,
  onEdit,
  onDelete,
  onViewDescription,
  onManageCourses,
  onManageModules,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFilterChange,
  type,
  getStatusDisplay
}) => {
  const { data, loading, error, pagination, filters } = state;
  const renderUserRow = (user: any) => (
    <li key={user.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{user.username}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-gray-500">Role: {user.role}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(user)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(user.id, 'user')}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  const renderCourseRow = (course: any) => (
    <li key={course.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{course.title}</p>
          <p className="text-sm text-gray-500">Volume: {course.volume || 'N/A'}</p>
          <p className="text-sm text-gray-500">Coefficient: {course.coefficient || 'N/A'}</p>
          <p className="text-sm text-gray-500">Status: {getStatusDisplay(course.status)}</p>
        </div>
        <div className="flex space-x-2">
          {onViewDescription && (
            <button
              onClick={() => onViewDescription(course)}
              className="text-green-600 hover:text-green-900"
            >
              View Description
            </button>
          )}
          {onManageModules && (
            <button
              onClick={() => onManageModules(course)}
              className="text-purple-600 hover:text-purple-900"
            >
              Manage Modules
            </button>
          )}
          <button
            onClick={() => onEdit(course)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(course.id, 'course')}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  const renderModuleRow = (module: any) => (
    <li key={module.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{module.title}</p>
          <p className="text-sm text-gray-500">Volume: {module.volume || 'N/A'}</p>
          <p className="text-sm text-gray-500">Coefficient: {module.coefficient || 'N/A'}</p>
          <p className="text-sm text-gray-500">Status: {getStatusDisplay(module.status)}</p>
        </div>
        <div className="flex space-x-2">
          {onViewDescription && (
            <button
              onClick={() => onViewDescription(module)}
              className="text-green-600 hover:text-green-900"
            >
              View Description
            </button>
          )}
          {onManageCourses && (
            <button
              onClick={() => onManageCourses(module)}
              className="text-purple-600 hover:text-purple-900"
            >
              Manage Courses
            </button>
          )}
          <button
            onClick={() => onEdit(module)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(module.id, 'module')}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  const renderSchoolYearRow = (schoolYear: any) => (
    <li key={schoolYear.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{schoolYear.title}</p>
          <p className="text-sm text-gray-500">
            {schoolYear.start_date} → {schoolYear.end_date}
          </p>
          <p className="text-sm text-gray-500">
            Company: {schoolYear.company?.name || 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Status: {getStatusDisplay(schoolYear.status)}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(schoolYear)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(schoolYear.id, 'schoolYear')}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  const renderSchoolYearPeriodRow = (period: any) => (
    <li key={period.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{period.title}</p>
          <p className="text-sm text-gray-500">
            {period.start_date} → {period.end_date}
          </p>
          <p className="text-sm text-gray-500">
            School Year: {period.schoolYear?.title || period.schoolYearTitle || 'N/A'}
          </p>
          <p className="text-sm text-gray-500">Status: {getStatusDisplay(period.status)}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(period)}
            className="text-blue-600 hover:text-blue-900"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(period.id, 'schoolYearPeriod')}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  const renderClassRoomRow = (cr: any) => (
    <li key={cr.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{cr.code} — {cr.title}</p>
          <p className="text-sm text-gray-500">Capacity: {cr.capacity}</p>
          <p className="text-sm text-gray-500">Company ID: {cr.company_id ?? 'N/A'}</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(cr)} className="text-blue-600 hover:text-blue-900">Edit</button>
          <button onClick={() => onDelete(cr.id, 'classRoom')} className="text-red-600 hover:text-red-900">Delete</button>
        </div>
      </div>
    </li>
  );

  const renderStudentRow = (s: any) => (
    <li key={s.id} className="px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{s.code} — {s.first_name} {s.last_name}</p>
          <p className="text-sm text-gray-500">Email: {s.email}</p>
          <p className="text-sm text-gray-500">
            {(() => {
              const classRoom = s.classRoom || s.class_room;
              const classLabel = classRoom 
                ? `${classRoom.title || ''}${classRoom.code ? (classRoom.title ? ` (${classRoom.code})` : classRoom.code) : ''}`.trim()
                : (s.class_room_id ? `ID: ${s.class_room_id}` : 'N/A');
              const companyLabel = s.company?.name || s.company_id || 'N/A';
              return <>Class: {classLabel} • Company: {companyLabel}</>;
            })()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button onClick={() => onEdit(s)} className="text-blue-600 hover:text-blue-900">Edit</button>
          <button onClick={() => onDelete(s.id, 'student')} className="text-red-600 hover:text-red-900">Delete</button>
        </div>
      </div>
    </li>
  );

  const renderRow = (item: any) => {
    switch (type) {
      case 'users':
        return renderUserRow(item);
      case 'courses':
        return renderCourseRow(item);
      case 'modules':
        return renderModuleRow(item);
      case 'schoolYears':
        return renderSchoolYearRow(item);
      case 'schoolYearPeriods':
        return renderSchoolYearPeriodRow(item);
      case 'classRooms':
        return renderClassRoomRow(item);
      case 'students':
        return renderStudentRow(item);
      default:
        return null;
    }
  };

  const getAddButtonText = () => {
    switch (type) {
      case 'users':
        return 'Add User';
      case 'courses':
        return 'Add Course';
      case 'modules':
        return 'Add Module';
      case 'schoolYears':
        return 'Add School Year';
      case 'schoolYearPeriods':
        return 'Add Period';
      case 'classRooms':
        return 'Add Class Room';
      case 'students':
        return 'Add Student';
      default:
        return 'Add Item';
    }
  };

  // Filter options for courses and modules
  const statusFilterOptions = [
    { value: null, label: 'All' },
    { value: 1, label: 'Active (1)' },
    { value: 0, label: 'Inactive (0)' }
  ];

  // Search placeholder based on type
  const getSearchPlaceholder = () => {
    switch (type) {
      case 'users':
        return 'Search by email or username...';
      case 'courses':
        return 'Search by course title...';
      case 'modules':
        return 'Search by module title...';
      case 'schoolYears':
        return 'Search by school year title...';
      case 'schoolYearPeriods':
        return 'Search by period or year title...';
      case 'classRooms':
        return 'Search by code or title...';
      case 'students':
        return 'Search by code, name or email...';
      default:
        return 'Search...';
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {/* Header with title and add button */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
        <button
          onClick={onAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {getAddButtonText()}
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <SearchBar
              onSearch={onSearch}
              placeholder={getSearchPlaceholder()}
              isLoading={loading}
            />
          </div>

          {/* Status Filter (for courses, modules, school years, and school year periods) */}
          {(type === 'courses' || type === 'modules' || type === 'schoolYears' || type === 'schoolYearPeriods') && onFilterChange && (
            <div className="w-full sm:w-48">
              <FilterDropdown
  options={statusFilterOptions}
  value={filters.status ?? null}
  onChange={(val) => onFilterChange?.(val === null ? null : Number(val))}
  placeholder="Filter by status"
  isLoading={loading}
/>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-200">
          <div className="text-sm text-red-600">
            Error: {error}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Data List */}
          <ul className="divide-y divide-gray-200">
            {Array.isArray(data) && data.length > 0 ? (
              data.map(renderRow)
            ) : (
              <li className="px-4 py-8 sm:px-6">
                <div className="text-center text-gray-500">
                  {filters.search ? (
                    <>
                      No {title.toLowerCase()} found matching "{filters.search}"
                    </>
                  ) : (
                    `No ${title.toLowerCase()} found`
                  )}
                </div>
              </li>
            )}
          </ul>

          {/* Pagination */}
          {pagination.total > 0 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
              isLoading={loading}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DataTable;
