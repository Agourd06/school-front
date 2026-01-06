import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/guards/ProtectedRoute';
import StudentRoute from './components/guards/StudentRoute';
import TeacherRoute from './components/guards/TeacherRoute';
import DashboardLayout from './components/layouts/DashboardLayout';
import StudentLayout from './components/layouts/StudentLayout';
import TeacherLayout from './components/layouts/TeacherLayout';
import AuthPage from './pages/AuthPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegistrationPage from './pages/RegistrationPage';
import SetPasswordPage from './pages/SetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import DashboardHomePage from './pages/dashboard/DashboardHomePage';
import ProgramsPage from './pages/dashboard/ProgramsPage';
import SpecializationsPage from './pages/dashboard/SpecializationsPage';
import LevelsPage from './pages/dashboard/LevelsPage';
import SchoolYearsPage from './pages/dashboard/SchoolYearsPage';
import SchoolYearPeriodsPage from './pages/dashboard/SchoolYearPeriodsPage';
import ClassesPage from './pages/dashboard/ClassesPage';
import CoursesPage from './pages/dashboard/CoursesPage';
import ModulesPage from './pages/dashboard/ModulesPage';
import ClassRoomsPage from './pages/dashboard/ClassRoomsPage';
import StudentsPage from './pages/dashboard/StudentsPage';
import ClassStudentsPage from './pages/dashboard/ClassStudentsPage';
import PlanningPage from './pages/dashboard/PlanningPage';
import StudentReportsPage from './pages/dashboard/StudentReportsPage';
import StudentPresencePage from './pages/dashboard/StudentPresencePage';
import StudentNotesPage from './pages/dashboard/StudentNotesPage';
import StudentReportDetailsPage from './pages/dashboard/StudentReportDetailsPage';
import PlanningSessionTypesPage from './pages/dashboard/PlanningSessionTypesPage';
import TeachersPage from './pages/dashboard/TeachersPage';
import AdministratorsPage from './pages/dashboard/AdministratorsPage';
import StudentLinkTypesPage from './pages/dashboard/StudentLinkTypesPage';
import StudentContactsPage from './pages/dashboard/StudentContactsPage';
import StudentDiplomesPage from './pages/dashboard/StudentDiplomesPage';
import LevelPricingsPage from './pages/dashboard/LevelPricingsPage';
import StudentPaymentsPage from './pages/dashboard/StudentPaymentsPage';
import AttestationsPage from './pages/dashboard/AttestationsPage';
import StudentAttestationsPage from './pages/dashboard/StudentAttestationsPage';
import ClassCoursesPage from './pages/dashboard/ClassCoursesPage';
import UsersPage from './pages/dashboard/UsersPage';
import CompaniesPage from './pages/dashboard/CompaniesPage';
import SettingsPage from './pages/SettingsPage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import StudentSchedulePage from './pages/student/StudentSchedulePage';
import StudentGradesPage from './pages/student/StudentGradesPage';
import StudentAttendancePage from './pages/student/StudentAttendancePage';
import TeacherDashboardPage from './pages/teacher/TeacherDashboardPage';
import TeacherPlanningsPage from './pages/teacher/TeacherPlanningsPage';
import TeacherAttendancePage from './pages/teacher/TeacherAttendancePage';
import TeacherGradesPage from './pages/teacher/TeacherGradesPage';
import TeacherLinksPage from './pages/teacher/TeacherLinksPage';
import TeacherHomeworkPage from './pages/teacher/TeacherHomeworkPage';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
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
              <><Navbar /><div className="pt-16"><AuthPage /></div></>
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
              <RegistrationPage />
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
              <><Navbar /><div className="pt-16"><ResetPasswordPage /></div></>
            )
          } 
        />
        <Route 
          path="/set-password" 
          element={<SetPasswordPage />} 
        />
        {/* Protected routes with Dashboard Layout - accessible to 'admin' and 'support' profiles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardHomePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/programs"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProgramsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/specializations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SpecializationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/levels"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LevelsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-years"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SchoolYearsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/school-year-periods"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SchoolYearPeriodsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClassesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CoursesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/modules"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ModulesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-rooms"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClassRoomsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-students"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClassStudentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PlanningPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-reports"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-presence"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentPresencePage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-notes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentNotesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-report-details"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentReportDetailsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planning-session-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PlanningSessionTypesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TeachersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/administrators"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AdministratorsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-link-types"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentLinkTypesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-contacts"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentContactsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-diplomes"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentDiplomesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/level-pricings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <LevelPricingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-payments"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentPaymentsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attestations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <AttestationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-attestations"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <StudentAttestationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-courses"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ClassCoursesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UsersPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <CompaniesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <SettingsPage />
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
                <StudentDashboardPage />
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/schedule"
          element={
            <StudentRoute>
              <StudentLayout>
                <StudentSchedulePage />
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/grades"
          element={
            <StudentRoute>
              <StudentLayout>
                <StudentGradesPage />
              </StudentLayout>
            </StudentRoute>
          }
        />
        <Route
          path="/student/attendance"
          element={
            <StudentRoute>
              <StudentLayout>
                <StudentAttendancePage />
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
                <TeacherDashboardPage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/plannings"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <TeacherPlanningsPage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/attendance"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <TeacherAttendancePage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/grades"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <TeacherGradesPage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/links"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <TeacherLinksPage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        <Route
          path="/teacher/homework"
          element={
            <TeacherRoute>
              <TeacherLayout>
                <TeacherHomeworkPage />
              </TeacherLayout>
            </TeacherRoute>
          }
        />
        {/* Profile route with Navbar */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute requireDashboardAccess={false}>
              <><Navbar /><div className="pt-16"><ProfilePage /></div></>
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
