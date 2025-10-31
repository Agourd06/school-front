import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import UsersSection from '../components/sections/UsersSection';
import CoursesSection from '../components/sections/CoursesSection';
import ModulesSection from '../components/sections/ModulesSection';
import SchoolYearsSection from '../components/sections/SchoolYearsSection';
import SchoolYearPeriodsSection from '../components/sections/SchoolYearPeriodsSection';
import ClassRoomsSection from '../components/sections/ClassRoomsSection';
import StudentsSection from '../components/sections/StudentsSection';
import TeachersSection from '../components/sections/TeachersSection';
import AdministratorsSection from '../components/sections/AdministratorsSection';

// Dashboard only handles tab selection and lazy-renders sections
export type DashboardTab =
  | 'users'
  | 'courses'
  | 'modules'
  | 'schoolYears'
  | 'schoolYearPeriods'
  | 'classRooms'
  | 'students'
  | 'teachers'
  | 'administrators';

const Dashboard: React.FC<{ initialTab?: DashboardTab }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'users');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>

            {activeTab === 'users' && <UsersSection />}
            {activeTab === 'courses' && <CoursesSection />}
            {activeTab === 'modules' && <ModulesSection />}
            {activeTab === 'schoolYears' && <SchoolYearsSection />}
            {activeTab === 'schoolYearPeriods' && <SchoolYearPeriodsSection />}
            {activeTab === 'classRooms' && <ClassRoomsSection />}
            {activeTab === 'students' && <StudentsSection />}
            {activeTab === 'teachers' && <TeachersSection />}
            {activeTab === 'administrators' && <AdministratorsSection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
