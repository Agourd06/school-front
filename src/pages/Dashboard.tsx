import React, { Suspense, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';

export type DashboardTab =
  | 'users'
  | 'programs'
  | 'specializations'
  | 'levels'
  | 'classes'
  | 'courses'
  | 'modules'
  | 'schoolYears'
  | 'schoolYearPeriods'
  | 'classRooms'
  | 'students'
  | 'teachers'
  | 'administrators'
  | 'studentLinkTypes'
  | 'studentContacts'
  | 'studentDiplomes';

const UsersSection = React.lazy(() => import('../components/sections/UsersSection'));
const ProgramsSection = React.lazy(() => import('../components/sections/ProgramsSection'));
const SpecializationsSection = React.lazy(() => import('../components/sections/SpecializationsSection'));
const LevelsSection = React.lazy(() => import('../components/sections/LevelsSection'));
const ClassesSection = React.lazy(() => import('../components/sections/ClassesSection'));
const CoursesSection = React.lazy(() => import('../components/sections/CoursesSection'));
const ModulesSection = React.lazy(() => import('../components/sections/ModulesSection'));
const SchoolYearsSection = React.lazy(() => import('../components/sections/SchoolYearsSection'));
const SchoolYearPeriodsSection = React.lazy(() => import('../components/sections/SchoolYearPeriodsSection'));
const ClassRoomsSection = React.lazy(() => import('../components/sections/ClassRoomsSection'));
const StudentsSection = React.lazy(() => import('../components/sections/StudentsSection'));
const TeachersSection = React.lazy(() => import('../components/sections/TeachersSection'));
const AdministratorsSection = React.lazy(() => import('../components/sections/AdministratorsSection'));
const StudentLinkTypesSection = React.lazy(() => import('../components/sections/StudentLinkTypesSection'));
const StudentContactsSection = React.lazy(() => import('../components/sections/StudentContactsSection'));
const StudentDiplomesSection = React.lazy(() => import('../components/sections/StudentDiplomesSection'));

const sectionComponents: Record<DashboardTab, React.LazyExoticComponent<React.FC>> = {
  users: UsersSection,
  programs: ProgramsSection,
  specializations: SpecializationsSection,
  levels: LevelsSection,
  classes: ClassesSection,
  courses: CoursesSection,
  modules: ModulesSection,
  schoolYears: SchoolYearsSection,
  schoolYearPeriods: SchoolYearPeriodsSection,
  classRooms: ClassRoomsSection,
  students: StudentsSection,
  teachers: TeachersSection,
  administrators: AdministratorsSection,
  studentLinkTypes: StudentLinkTypesSection,
  studentContacts: StudentContactsSection,
  studentDiplomes: StudentDiplomesSection,
};

const Dashboard: React.FC<{ initialTab?: DashboardTab }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'users');

  const SectionComponent = useMemo(() => sectionComponents[activeTab], [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <Suspense fallback={<div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">Loading section…</div>}>
              <SectionComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
