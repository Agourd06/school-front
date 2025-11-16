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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
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
