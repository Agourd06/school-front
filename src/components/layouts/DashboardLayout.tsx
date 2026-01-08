import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import { SchoolYearProvider } from '../../context/SchoolYearContext';
import { ProgramProvider } from '../../context/ProgramContext';
import { SpecializationProvider } from '../../context/SpecializationContext';
import { routePathToTab, tabToRoutePath, type RouteTab } from '../../utils/routeMapping';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component that wraps all dashboard pages with:
 * - Sidebar navigation
 * - Context providers (SchoolYear, Program, Specialization)
 * - Responsive sidebar toggle
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const location = useLocation();

  const navigate = useNavigate();

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
    navigate(route);
  };

  return (
    <SchoolYearProvider>
      <ProgramProvider>
        <SpecializationProvider>
          <Navbar />
          <div className="min-h-screen bg-surface flex pt-16">
            <Sidebar
              activeTab={currentRouteTab}
              onTabChange={handleTabChange}
              onToggleCollapse={toggleSidebarVisibility}
              isCollapsed={!isSidebarVisible}
            />

            {!isSidebarVisible && (
              <button
                type="button"
                onClick={toggleSidebarVisibility}
                className="hidden sm:flex fixed top-20 left-4 z-30 h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-heading shadow-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                aria-label="Show sidebar"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <main
              className={`flex-1 transition-all duration-300 ${
                isSidebarVisible ? 'ml-64' : 'ml-0'
              }`}
              role="main"
            >
              <div className="max-w-[86rem] mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
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

