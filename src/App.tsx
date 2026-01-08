import React, { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/guards/ProtectedRoute';
import StudentRoute from './components/guards/StudentRoute';
import TeacherRoute from './components/guards/TeacherRoute';
import DashboardLayout from './components/layouts/DashboardLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherLayout from './components/layouts/TeacherLayout';

// Lazy load all page components for code splitting
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'));
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Dashboard pages
const DashboardHomePage = lazy(() => import('./pages/dashboard/DashboardHomePage'));
const ProgramsPage = lazy(() => import('./pages/dashboard/ProgramsPage'));
const SpecializationsPage = lazy(() => import('./pages/dashboard/SpecializationsPage'));
const LevelsPage = lazy(() => import('./pages/dashboard/LevelsPage'));
const SchoolYearsPage = lazy(() => import('./pages/dashboard/SchoolYearsPage'));
const SchoolYearPeriodsPage = lazy(() => import('./pages/dashboard/SchoolYearPeriodsPage'));
const ClassesPage = lazy(() => import('./pages/dashboard/ClassesPage'));
const CoursesPage = lazy(() => import('./pages/dashboard/CoursesPage'));
const ModulesPage = lazy(() => import('./pages/dashboard/ModulesPage'));
const ClassRoomsPage = lazy(() => import('./pages/dashboard/ClassRoomsPage'));
const StudentsPage = lazy(() => import('./pages/dashboard/StudentsPage'));
const ClassStudentsPage = lazy(() => import('./pages/dashboard/ClassStudentsPage'));
const PlanningPage = lazy(() => import('./pages/dashboard/PlanningPage'));
const StudentReportsPage = lazy(() => import('./pages/dashboard/StudentReportsPage'));
const StudentPresencePage = lazy(() => import('./pages/dashboard/StudentPresencePage'));
const StudentNotesPage = lazy(() => import('./pages/dashboard/StudentNotesPage'));
const StudentReportDetailsPage = lazy(() => import('./pages/dashboard/StudentReportDetailsPage'));
const PlanningSessionTypesPage = lazy(() => import('./pages/dashboard/PlanningSessionTypesPage'));
const TeachersPage = lazy(() => import('./pages/dashboard/TeachersPage'));
const AdministratorsPage = lazy(() => import('./pages/dashboard/AdministratorsPage'));
const StudentLinkTypesPage = lazy(() => import('./pages/dashboard/StudentLinkTypesPage'));
const StudentContactsPage = lazy(() => import('./pages/dashboard/StudentContactsPage'));
const StudentDiplomesPage = lazy(() => import('./pages/dashboard/StudentDiplomesPage'));
const LevelPricingsPage = lazy(() => import('./pages/dashboard/LevelPricingsPage'));
const StudentPaymentsPage = lazy(() => import('./pages/dashboard/StudentPaymentsPage'));
const AttestationsPage = lazy(() => import('./pages/dashboard/AttestationsPage'));
const StudentAttestationsPage = lazy(() => import('./pages/dashboard/StudentAttestationsPage'));
const ClassCoursesPage = lazy(() => import('./pages/dashboard/ClassCoursesPage'));
const UsersPage = lazy(() => import('./pages/dashboard/UsersPage'));
const CompaniesPage = lazy(() => import('./pages/dashboard/CompaniesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Student pages
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage'));
const StudentSchedulePage = lazy(() => import('./pages/student/StudentSchedulePage'));
const StudentGradesPage = lazy(() => import('./pages/student/StudentGradesPage'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage'));

// Teacher pages
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage'));
const TeacherPlanningsPage = lazy(() => import('./pages/teacher/TeacherPlanningsPage'));
const TeacherAttendancePage = lazy(() => import('./pages/teacher/TeacherAttendancePage'));
const TeacherGradesPage = lazy(() => import('./pages/teacher/TeacherGradesPage'));
const TeacherLinksPage = lazy(() => import('./pages/teacher/TeacherLinksPage'));
const TeacherHomeworkPage = lazy(() => import('./pages/teacher/TeacherHomeworkPage'));

// Loading fallback component
const PageLoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-xl font-bold text-primary">{t('common.loading')}</div>
    </div>
  );
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Routes>
        {/* Public routes without Navbar */}
        <Route 
          path="/auth" 
          element={
            user ? (
              user.profile === 'student' ? (
                <Navigate to="/student" replace />
              ) : user.profile === 'teacher' ? (
                <Navigate to="/teacher" replace />
              ) : (
                <Navigate to="/programs" replace />
              )
            ) : (
              <><Navbar /><div className="pt-16"><Suspense fallback={<PageLoadingFallback />}><AuthPage /></Suspense></div></>
            )
          } 
        />
        <Route 
          path="/login" 
          element={<Navigate to="/auth?mode=login" />} 
        />
        <Route 
          path="/registerMyschool" 
          element={
            user ? (
              user.profile === 'student' ? (
                <Navigate to="/student" replace />
              ) : user.profile === 'teacher' ? (
                <Navigate to="/teacher" replace />
              ) : (
                <Navigate to="/programs" replace />
              )
            ) : (
              <Suspense fallback={<PageLoadingFallback />}><RegistrationPage /></Suspense>
            )
          } 
        />
        <Route 
          path="/signup" 
          element={<Navigate to="/registerMyschool" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<Navigate to="/auth?mode=forgot-password" />} 
        />
        <Route 
          path="/reset-password" 
          element={
            user ? (
              user.profile === 'student' ? (
                <Navigate to="/student" replace />
              ) : user.profile === 'teacher' ? (
                <Navigate to="/teacher" replace />
              ) : (
                <Navigate to="/programs" replace />
              )
            ) : (
              <><Navbar /><div className="pt-16"><Suspense fallback={<PageLoadingFallback />}><ResetPasswordPage /></Suspense></div></>
            )
          } 
        />
        <Route 
          path="/set-password" 
          element={<Suspense fallback={<PageLoadingFallback />}><SetPasswordPage /></Suspense>} 
        />
        {/* Protected routes with Dashboard Layout - accessible to 'admin' and 'support' profiles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><DashboardHomePage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ProgramsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/specializations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><SpecializationsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/levels"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><LevelsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-years"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><SchoolYearsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-year-periods"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><SchoolYearPeriodsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ClassesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><CoursesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ModulesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-rooms"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ClassRoomsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-students"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ClassStudentsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><PlanningPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentReportsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-presence"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentPresencePage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-notes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentNotesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-report-details"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentReportDetailsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning-session-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><PlanningSessionTypesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeachersPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrators"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><AdministratorsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-link-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentLinkTypesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-contacts"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentContactsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-diplomes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentDiplomesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/level-pricings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><LevelPricingsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-payments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentPaymentsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attestations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><AttestationsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-attestations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentAttestationsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-courses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ClassCoursesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><UsersPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><CompaniesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><SettingsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Student routes with StudentLayout */}
        <Route
          path="/student"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentDashboardPage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentSchedulePage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/grades"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentGradesPage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentAttendancePage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        {/* Teacher routes with TeacherLayout */}
        <Route
          path="/teacher"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherDashboardPage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/plannings"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherPlanningsPage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherAttendancePage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/grades"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherGradesPage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/links"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherLinksPage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/homework"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><TeacherHomeworkPage /></Suspense>
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        {/* Profile route with Navbar */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute requireDashboardAccess={false}>
              <><Navbar /><div className="pt-16"><Suspense fallback={<PageLoadingFallback />}><ProfilePage /></Suspense></div></>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            user ? (
              user.profile === 'student' ? (
                <Navigate to="/student" replace />
              ) : user.profile === 'teacher' ? (
                <Navigate to="/teacher" replace />
              ) : (
                <Navigate to="/programs" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
        {/* Catch-all route for undefined paths */}
        <Route 
          path="*" 
          element={
            user ? (
              user.profile === 'student' ? (
                <Navigate to="/student" replace />
              ) : user.profile === 'teacher' ? (
                <Navigate to="/teacher" replace />
              ) : (
                <Navigate to="/programs" replace />
              )
            ) : (
              <Navigate to="/auth" replace />
            )
          } 
        />
      </Routes>
    </div>
  );
};

export default App;
