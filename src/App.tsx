import React, { Suspense, lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { getDefaultRoute } from './utils/permissions';
import { usePagesInitialization } from './hooks/usePagesInitialization';
import { useRestrictNewAdminRole } from './hooks/useRestrictNewAdminRole';
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
const DashboardStudentAttestationsPage = lazy(() => import('./pages/dashboard/StudentAttestationsPage'));

const ClassCoursesPage = lazy(() => import('./pages/dashboard/ClassCoursesPage'));
const UsersPage = lazy(() => import('./pages/dashboard/UsersPage'));
const CompaniesPage = lazy(() => import('./pages/dashboard/CompaniesPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ColorsSettingsPage = lazy(() => import('./pages/settings/ColorsSettingsPage'));
const PageAccessSettingsPage = lazy(() => import('./pages/settings/PageAccessSettingsPage'));
const RolesSettingsPage = lazy(() => import('./pages/settings/RolesSettingsPage'));
const TypesSettings = lazy(() => import('./components/settings/TypesSettings'));
const LinkTypesPage = lazy(() => import('./pages/settings/types/LinkTypesPage'));
const ClassroomTypesPage = lazy(() => import('./pages/settings/types/ClassroomTypesPage'));
const PlanningTypesPage = lazy(() => import('./pages/settings/types/PlanningTypesPage'));
const RolesPage = lazy(() => import('./pages/dashboard/RolesPage'));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage'));

// Student pages
const StudentDashboardPage = lazy(() => import('./pages/student/StudentDashboardPage'));
const StudentSchedulePage = lazy(() => import('./pages/student/StudentSchedulePage'));
const StudentGradesPage = lazy(() => import('./pages/student/StudentGradesPage'));
const StudentAttendancePage = lazy(() => import('./pages/student/StudentAttendancePage'));
const StudentAttestationsPage = lazy(() => import('./pages/student/StudentAttestationsPage'));

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

// Stable redirect component to prevent infinite loops
const StableRedirect: React.FC<{ to: string }> = ({ to }) => {
  const location = useLocation();
  // Only redirect if we're not already on the target route
  if (location.pathname === to) {
    return null;
  }
  return <Navigate to={to} replace />;
};

const App: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();

  // Initialize pages in database on app startup (only for admin users)
  // Pages are global and shared across all companies
  // Check both old profile field and new roles array for backward compatibility
  const isAdmin = user?.profile === 'admin' || user?.roles?.includes('admin') === true;
  usePagesInitialization(isAdmin, true);
  
  // Safety net: Restrict new admin users to only /settings and /users pages
  // NOTE: Backend now handles this automatically during user creation.
  // This hook is kept as a safety net in case backend restriction fails.
  // Set to false to disable if backend is confirmed working correctly.
  useRestrictNewAdminRole(true); // Set to false to disable safety net

  // Memoize default route to prevent infinite loops
  // Only recalculate when profile, roles, or allowedPages actually change
  const allowedPagesKey = user?.allowedPages ? JSON.stringify([...user.allowedPages].sort()) : '';
  const rolesKey = user?.roles ? JSON.stringify([...user.roles].sort()) : '';
  const defaultRoute = useMemo(() => {
    const route = getDefaultRoute(user);
    // Debug logging (remove in production)
    if (import.meta.env.DEV) {
      console.log('[App] Default route calculation:', {
        profile: user?.profile,
        roles: user?.roles,
        defaultRoute: route,
      });
    }
    return route;
  }, [user?.profile, rolesKey, allowedPagesKey]);

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
              <StableRedirect to={defaultRoute} />
            ) : (
              <><Navbar /><div style={{ paddingTop: 'var(--navbar-height, 4rem)' }}><Suspense fallback={<PageLoadingFallback />}><AuthPage /></Suspense></div></>
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
              <StableRedirect to={defaultRoute} />
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
              <StableRedirect to={defaultRoute} />
            ) : (
              <><Navbar /><div style={{ paddingTop: 'var(--navbar-height, 4rem)' }}><Suspense fallback={<PageLoadingFallback />}><ResetPasswordPage /></Suspense></div></>
            )
          } 
        />
        <Route 
          path="/set-password" 
          element={<Suspense fallback={<PageLoadingFallback />}><SetPasswordPage /></Suspense>} 
        />
        {/* SECURITY: Student and Teacher routes MUST come BEFORE dashboard routes */}
        {/* This ensures students/teachers can access their pages without being blocked */}
        {/* Student routes with StudentLayout - NO sidebar, only bottom navigation */}
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
        <Route
          path="/student/attestations"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><StudentAttestationsPage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <StudentRoute>
              <StudentLayout>
                <Suspense fallback={<PageLoadingFallback />}><ProfilePage /></Suspense>
              </StudentLayout>
            </StudentRoute>
          }
        />
        {/* Teacher routes with TeacherLayout - NO sidebar, only bottom navigation */}
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
          path="/teacher/profile"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <Suspense fallback={<PageLoadingFallback />}><ProfilePage /></Suspense>
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
        {/* Protected routes with Dashboard Layout - accessible to 'admin' and 'support' profiles ONLY */}
        {/* SECURITY: These routes use ProtectedRoute which blocks students/teachers */}
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
                <Suspense fallback={<PageLoadingFallback />}><DashboardStudentAttestationsPage /></Suspense>
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
        {/* Settings routes with nested structure */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute requiredPage="/settings">
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><SettingsPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        >
          {/* Main settings tabs */}
          <Route
            path="colors"
            element={
              <ProtectedRoute requiredPage="/settings/colors">
                <Suspense fallback={<PageLoadingFallback />}><ColorsSettingsPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="access"
            element={
              <ProtectedRoute requiredPage="/settings/access">
                <Suspense fallback={<PageLoadingFallback />}><PageAccessSettingsPage /></Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="roles"
            element={
              <ProtectedRoute requiredPage="/settings/roles">
                <Suspense fallback={<PageLoadingFallback />}><RolesSettingsPage /></Suspense>
              </ProtectedRoute>
            }
          />
          {/* Types settings with nested sub-routes */}
          <Route
            path="types"
            element={
              <ProtectedRoute requiredPage="/settings">
                <Suspense fallback={<PageLoadingFallback />}><TypesSettings /></Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              path="link"
              element={
                <ProtectedRoute requiredPage="/settings/types/link">
                  <Suspense fallback={<PageLoadingFallback />}><LinkTypesPage /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="classroom"
              element={
                <ProtectedRoute requiredPage="/settings/types/classroom">
                  <Suspense fallback={<PageLoadingFallback />}><ClassroomTypesPage /></Suspense>
                </ProtectedRoute>
              }
            />
            <Route
              path="planning"
              element={
                <ProtectedRoute requiredPage="/settings/types/planning">
                  <Suspense fallback={<PageLoadingFallback />}><PlanningTypesPage /></Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>
        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredPage="/roles">
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><RolesPage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/unauthorized"
          element={
            <><Navbar /><div style={{ paddingTop: 'var(--navbar-height, 4rem)' }}><Suspense fallback={<PageLoadingFallback />}><UnauthorizedPage /></Suspense></div></>
          }
        />
        {/* Profile route with DashboardLayout (includes Sidebar) - ONLY for admin/support profiles */}
        {/* SECURITY: Student/teacher routes are defined earlier (before dashboard routes) */}
        {/* This ensures they can access their pages without being blocked */}
        {/* SECURITY: Students and teachers are redirected to their pages via ProtectedRoute */}
        {/* Profile page - ONLY for admin/support profiles */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute requireDashboardAccess={false}>
              <DashboardLayout>
                <Suspense fallback={<PageLoadingFallback />}><ProfilePage /></Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            user ? (
              <StableRedirect to={defaultRoute} />
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
              <StableRedirect to={defaultRoute} />
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
