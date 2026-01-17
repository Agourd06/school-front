import React, { useState, useEffect } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { SchoolYearProvider } from '../../context/SchoolYearContext';
import { ProgramProvider } from '../../context/ProgramContext';
import { SpecializationProvider } from '../../context/SpecializationContext';
import { routePathToTab, tabToRoutePath, type RouteTab } from '../../utils/routeMapping';
import { isStudentRole, isTeacherRole } from '../../utils/permissions';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that wraps all dashboard pages with:
 * - Sidebar navigation (ONLY for admin/support profiles)
 * - Context providers (SchoolYear, Program, Specialization)
 * - Responsive sidebar toggle
 * 
 * SECURITY: This layout is ONLY for admin/support profiles
 * Students and teachers are automatically redirected to their pages
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  // SECURITY: Block students and teachers from seeing DashboardLayout IMMEDIATELY
  // BUT: Only if they have ONLY student/teacher roles (no dashboard roles)
  // Users with both teacher and dashboard roles (e.g., 'teacher' + 'finance') should see dashboard
  // This check happens BEFORE any rendering to prevent sidebar from showing
  // CRITICAL: This is a second line of defense - ProtectedRoute should catch it first
  // CRITICAL: Roles are now in a separate table - users can have multiple roles
  // We should ONLY check the roles array, NOT the profile field
  // Normalize role codes to lowercase for case-insensitive comparison
  const userRoles = Array.isArray(user?.roles) 
    ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
  
  // Define dashboard roles - users with these roles should access dashboard
  const dashboardRoles = ['admin', 'finance', 'direction', 'scholarity', 'support'];
  
  // Check if user has any dashboard roles (excluding student/teacher/parent)
  const hasDashboardRole = userRoles.some(role => 
    dashboardRoles.includes(role) || 
    // Custom roles (like '26c630a3') are also considered dashboard roles
    (!['student', 'teacher', 'parent', 'parents'].includes(role))
  );
  
  // Check if user is student or teacher - use helper functions from permissions
  const isStudent = isStudentRole(userRoles);
  const isTeacher = isTeacherRole(userRoles);
  
  // Only redirect if user has student/teacher role AND no dashboard roles
  if (isStudent && !hasDashboardRole) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/student') {
      window.location.replace('/student');
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Redirecting to student page...</div>
        </div>
      );
    }
    return <Navigate to="/student" replace />;
  }
  if (isTeacher && !hasDashboardRole) {
    if (typeof window !== 'undefined' && window.location.pathname !== '/teacher') {
      window.location.replace('/teacher');
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <div className="text-xl font-bold text-primary">Redirecting to teacher page...</div>
        </div>
      );
    }
    return <Navigate to="/teacher" replace />;
  }

  // Only render DashboardLayout if user is NOT student/teacher
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Get current route tab from location pathname
  const currentRouteTab = routePathToTab(location.pathname) || 'programs';

  // Handle sidebar toggle from mobile menu
  useEffect(() => {
    const handler = () => setIsSidebarVisible((prev) => !prev);
    window.addEventListener('toggle-sidebar', handler as EventListener);
    return () => window.removeEventListener('toggle-sidebar', handler as EventListener);
  }, []);

  const toggleSidebarVisibility = () => setIsSidebarVisible((prev) => !prev);

  const handleTabChange = (tab: RouteTab) => {
    const route = tabToRoutePath(tab);
    if (route) {
      window.location.href = route;
    }
  };

  // Double-check: Ensure we NEVER render Sidebar for students/teachers
  // This check happens before rendering to prevent any sidebar flash
  const shouldRenderSidebar = user && user.profile !== 'student' && user.profile !== 'teacher';

  return (
    <SchoolYearProvider>
      <ProgramProvider>
        <SpecializationProvider>
          <Navbar />
          <div className="min-h-screen bg-surface flex" style={{ paddingTop: 'var(--navbar-height, 4rem)' }}>
            {/* SECURITY: Only render Sidebar for admin/support profiles */}
            {/* Students/teachers should NEVER see this sidebar */}
            {shouldRenderSidebar && (
              <Sidebar
                activeTab={currentRouteTab}
                onTabChange={handleTabChange}
                onToggleCollapse={toggleSidebarVisibility}
                isCollapsed={!isSidebarVisible}
              />
            )}

            {/* Only show sidebar toggle button if sidebar should be rendered */}
            {shouldRenderSidebar && !isSidebarVisible && (
              <button
                type="button"
                onClick={toggleSidebarVisibility}
                className="hidden sm:flex fixed left-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-tertiary bg-surface text-heading shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/40"
                style={{ top: 'calc(var(--navbar-height, 4rem) + 1rem)' }}
                aria-label="Show sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <main
              className={`flex-1 transition-all duration-300 ${
                shouldRenderSidebar && isSidebarVisible ? 'ml-64' : 'ml-0'
              }`}
              role="main"
            >
              <div className="max-w-[86rem] mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 sm:px-0">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </SpecializationProvider>
      </ProgramProvider>
    </SchoolYearProvider>
  );
};

export default DashboardLayout;

