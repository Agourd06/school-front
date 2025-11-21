import React, { Suspense, useMemo, useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { SchoolYearProvider, useSchoolYear } from '../context/SchoolYearContext';
import { ProgramProvider, useProgram } from '../context/ProgramContext';
import { SpecializationProvider, useSpecialization } from '../context/SpecializationContext';

export type DashboardTab =
  | 'users'
  | 'companies'
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
  | 'classStudents'
  | 'planning'
  | 'studentReports'
  | 'studentPresence'
  | 'studentNotes'
  | 'studentReportDetails'
  | 'planningSessionTypes'
  | 'teachers'
  | 'administrators'
  | 'studentLinkTypes'
  | 'studentContacts'
  | 'studentDiplomes'
  | 'levelPricings'
  | 'studentPayments'
  | 'attestations'
  | 'studentAttestations';

const UsersSection = React.lazy(() => import('../components/sections/UsersSection'));
const CompaniesSection = React.lazy(() => import('../components/sections/CompaniesSection'));
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
const ClassStudentsSection = React.lazy(() => import('../components/sections/ClassStudentsSection'));
const PlanningSection = React.lazy(() => import('../components/sections/PlanningSection'));
const StudentReportsSection = React.lazy(() => import('../components/sections/StudentReportsSection'));
const StudentPresenceSection = React.lazy(() => import('../components/sections/StudentPresenceSection'));
const StudentNotesSection = React.lazy(() => import('../components/sections/StudentNotesSection'));
const StudentReportDetailsSection = React.lazy(() => import('../components/sections/StudentReportDetailsSection'));
const PlanningSessionTypesSection = React.lazy(() => import('../components/sections/PlanningSessionTypesSection'));
const TeachersSection = React.lazy(() => import('../components/sections/TeachersSection'));
const AdministratorsSection = React.lazy(() => import('../components/sections/AdministratorsSection'));
const StudentLinkTypesSection = React.lazy(() => import('../components/sections/StudentLinkTypesSection'));
const StudentContactsSection = React.lazy(() => import('../components/sections/StudentContactsSection'));
const StudentDiplomesSection = React.lazy(() => import('../components/sections/StudentDiplomesSection'));
const LevelPricingsSection = React.lazy(() => import('../components/sections/LevelPricingsSection'));
const StudentPaymentsSection = React.lazy(() => import('../components/sections/StudentPaymentsSection'));
const AttestationsSection = React.lazy(() => import('../components/sections/AttestationsSection'));
const StudentAttestationsSection = React.lazy(() => import('../components/sections/StudentAttestationsSection'));

const sectionComponents: Record<DashboardTab, React.LazyExoticComponent<React.FC>> = {
  users: UsersSection,
  companies: CompaniesSection,
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
  classStudents: ClassStudentsSection,
  planning: PlanningSection,
  studentReports: StudentReportsSection,
  studentPresence: StudentPresenceSection,
  studentNotes: StudentNotesSection,
  studentReportDetails: StudentReportDetailsSection,
  planningSessionTypes: PlanningSessionTypesSection,
  teachers: TeachersSection,
  administrators: AdministratorsSection,
  studentLinkTypes: StudentLinkTypesSection,
  studentContacts: StudentContactsSection,
  studentDiplomes: StudentDiplomesSection,
  levelPricings: LevelPricingsSection,
  studentPayments: StudentPaymentsSection,
  attestations: AttestationsSection,
  studentAttestations: StudentAttestationsSection,
};

const DashboardContent: React.FC<{ initialTab?: DashboardTab }> = ({ initialTab }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab || 'users');
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const { setNavigateToPeriods } = useSchoolYear();
  const { setNavigateToSpecializations, setNavigateBackToPrograms } = useProgram();
  const { setNavigateToLevels, setNavigateBackToSpecializations } = useSpecialization();

  const SectionComponent = useMemo(() => sectionComponents[activeTab], [activeTab]);

  useEffect(() => {
    setNavigateToPeriods(() => {
      setActiveTab('schoolYearPeriods');
    });
    setNavigateToSpecializations(() => {
      setActiveTab('specializations');
    });
    setNavigateToLevels(() => {
      setActiveTab('levels');
    });
    setNavigateBackToSpecializations(() => {
      setActiveTab('specializations');
    });
    setNavigateBackToPrograms(() => {
      setActiveTab('programs');
    });
  }, [setNavigateToPeriods, setNavigateToSpecializations, setNavigateToLevels, setNavigateBackToSpecializations, setNavigateBackToPrograms]);

  const toggleSidebarVisibility = () => setIsSidebarVisible((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onToggleCollapse={toggleSidebarVisibility}
        isCollapsed={!isSidebarVisible}
      />

      {!isSidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebarVisibility}
          className="hidden sm:flex fixed top-24 left-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          aria-label="Show sidebar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarVisible ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="max-w-[86rem] mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Suspense fallback={<div className="rounded-md border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">Loading section…</div>}>
              <SectionComponent />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ initialTab?: DashboardTab }> = ({ initialTab }) => {
  return (
    <SchoolYearProvider>
      <ProgramProvider>
        <SpecializationProvider>
          <DashboardContent initialTab={initialTab} />
        </SpecializationProvider>
      </ProgramProvider>
    </SchoolYearProvider>
  );
};

export default Dashboard;
