import React, { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import { useDeleteCompany } from '../hooks/useCompanies';
import { useCourses, useDeleteCourse } from '../hooks/useCourses';
import { useModules, useDeleteModule } from '../hooks/useModules';
import { UserModal, CourseModal, ModuleModal, DescriptionModal } from '../components/modals';
import Sidebar from '../components/Sidebar';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'courses' | 'modules'>('users');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [descriptionItem, setDescriptionItem] = useState<any>(null);

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

  // Data fetching
  const { data: users, isLoading: usersLoading } = useUsers();
  // const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { data: modules, isLoading: modulesLoading } = useModules();

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

  const renderUsersTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add User
        </button>
      </div>
      {usersLoading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {users?.map((user) => (
            <li key={user.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <p className="text-sm text-gray-500">Role: {user.role}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, 'user')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

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

  const renderCoursesTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Courses</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Course
        </button>
      </div>
      {coursesLoading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {courses?.map((course) => (
            <li key={course.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-500">Volume: {course.volume || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Status: {getStatusDisplay(course.status)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDescriptionClick(course)}
                    className="text-green-600 hover:text-green-900"
                  >
                    View Description
                  </button>
                  <button
                    onClick={() => handleEditClick(course)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, 'course')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderModulesTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Modules</h3>
        <button
          onClick={handleAddClick}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Module
        </button>
      </div>
      {modulesLoading ? (
        <div className="p-4 text-center">Loading...</div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {modules?.map((module) => (
            <li key={module.id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{module.title}</p>
                  <p className="text-sm text-gray-500">Volume: {module.volume || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Status: {getStatusDisplay(module.status)}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDescriptionClick(module)}
                    className="text-green-600 hover:text-green-900"
                  >
                    View Description
                  </button>
                  <button
                    onClick={() => handleEditClick(module)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(module.id, 'module')}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

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
            {activeTab === 'users' && renderUsersTable()}
            {activeTab === 'courses' && renderCoursesTable()}
            {activeTab === 'modules' && renderModulesTable()}
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
    </div>
  );
};

export default Dashboard;
