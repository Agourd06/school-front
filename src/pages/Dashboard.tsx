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
  | 'studentAttestations'
  | 'classCourses';

// Component cache to avoid recreating lazy components
const componentCache = new Map<DashboardTab, React.LazyExoticComponent<React.FC>>();

// Dynamic component loader - only loads components when needed
const loadSectionComponent = (tab: DashboardTab): React.LazyExoticComponent<React.FC> => {
  // Return cached component if it exists
  if (componentCache.has(tab)) {
    return componentCache.get(tab)!;
  }

  const componentMap: Record<DashboardTab, () => Promise<{ default: React.FC }>> = {
    users: () => import('../components/sections/UsersSection'),
    companies: () => import('../components/sections/CompaniesSection'),
    programs: () => import('../components/sections/ProgramsSection'),
    specializations: () => import('../components/sections/SpecializationsSection'),
    levels: () => import('../components/sections/LevelsSection'),
    classes: () => import('../components/sections/ClassesSection'),
    courses: () => import('../components/sections/CoursesSection'),
    modules: () => import('../components/sections/ModulesSection'),
    schoolYears: () => import('../components/sections/SchoolYearsSection'),
    schoolYearPeriods: () => import('../components/sections/SchoolYearPeriodsSection'),
    classRooms: () => import('../components/sections/ClassRoomsSection'),
    students: () => import('../components/sections/StudentsSection'),
    classStudents: () => import('../components/sections/ClassStudentsSection'),
    planning: () => import('../components/sections/PlanningSection'),
    studentReports: () => import('../components/sections/StudentReportsSection'),
    studentPresence: () => import('../components/sections/StudentPresenceSection'),
    studentNotes: () => import('../components/sections/StudentNotesSection'),
    studentReportDetails: () => import('../components/sections/StudentReportDetailsSection'),
    planningSessionTypes: () => import('../components/sections/PlanningSessionTypesSection'),
    teachers: () => import('../components/sections/TeachersSection'),
    administrators: () => import('../components/sections/AdministratorsSection'),
    studentLinkTypes: () => import('../components/sections/StudentLinkTypesSection'),
    studentContacts: () => import('../components/sections/StudentContactsSection'),
    studentDiplomes: () => import('../components/sections/StudentDiplomesSection'),
    levelPricings: () => import('../components/sections/LevelPricingsSection'),
    studentPayments: () => import('../components/sections/StudentPaymentsSection'),
    attestations: () => import('../components/sections/AttestationsSection'),
    studentAttestations: () => import('../components/sections/StudentAttestationsSection'),
    classCourses: () => import('../components/sections/ClassCoursesSection'),
  };

  const loader = componentMap[tab] || (() => import('../components/sections/StudentsSection'));
  const lazyComponent = React.lazy(loader);
  
  // Cache the component for future use
  componentCache.set(tab, lazyComponent);
  
  return lazyComponent;
};

const DashboardContent: React.FC<{ initialTab?: DashboardTab }> = ({ initialTab }) => {
  // Filter out 'users' and 'companies' from allowed tabs
  const getAllowedTab = (tab: DashboardTab | undefined): DashboardTab => {
    if (!tab || tab === 'users' || tab === 'companies') {
      return 'students'; // Default to students if invalid or restricted tab
    }
    return tab;
  };

  const [activeTab, setActiveTab] = useState<DashboardTab>(getAllowedTab(initialTab));
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const { setNavigateToPeriods } = useSchoolYear();
  const { setNavigateToSpecializations, setNavigateBackToPrograms } = useProgram();
  const { setNavigateToLevels, setNavigateBackToSpecializations } = useSpecialization();

  // Prevent navigation to restricted tabs
  const handleTabChange = (tab: DashboardTab) => {
    if (tab !== 'users' && tab !== 'companies') {
      setActiveTab(tab);
    }
  };

  // Dynamically load component only when tab changes
  const SectionComponent = useMemo(() => loadSectionComponent(activeTab), [activeTab]);

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
    <div className="min-h-screen bg-surface flex">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onToggleCollapse={toggleSidebarVisibility}
        isCollapsed={!isSidebarVisible}
      />

      {!isSidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebarVisibility}
          className="hidden sm:flex fixed top-24 left-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-heading shadow-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
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
            <Suspense fallback={<div className="rounded-md border border-dashed border-border bg-surface p-6 text-sm text-muted">Loading section…</div>}>
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
