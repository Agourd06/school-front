import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { tabToRoutePath, routePathToTab, type RouteTab } from "../utils/routeMapping";

interface SidebarProps {
  activeTab: RouteTab;
  onTabChange: (tab: RouteTab) => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onToggleCollapse,
  isCollapsed,
}) => {
  const location = useLocation();
  const [isParametersOpen, setIsParametersOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // Determine active tab from current route
  const currentRouteTab = routePathToTab(location.pathname) || activeTab;

  const toggleParameters = () => {
    setIsParametersOpen(!isParametersOpen);
  };

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const handler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler as EventListener);
    return () => window.removeEventListener("toggle-sidebar", handler as EventListener);
  }, []);

  const closeMobile = () => setIsMobileOpen(false);

  const parameterGroups: Array<{
    title: string;
    items: Array<{ tab: SidebarProps['activeTab']; label: string }>;
  }> = [
  
    {
      title: 'Academic Setup',
      items: [
  
      ],
    },
    {
      title: 'Class Management',
      items: [
        { tab: 'classes', label: 'Classes' },
        { tab: 'planningSessionTypes', label: 'Planning Session Types' },
      ],
    },
    {
      title: 'Student',
      items: [
       
        { tab: 'administrators', label: 'Administrators' },
        { tab: 'studentReports', label: 'Student Reports' },
        { tab: 'studentLinkTypes', label: 'Student Link Types' },
        { tab: 'studentContacts', label: 'Student Contacts' },
        { tab: 'studentDiplomes', label: 'Student Diplomes' },
        { tab: 'attestations', label: 'Attestations' },
        { tab: 'studentAttestations', label: 'Student Attestations' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { tab: 'levelPricings', label: 'Level Pricings' },
        { tab: 'studentPayments', label: 'Student Payments' },
      ],
    },
    // New parameter groups (empty for now - will replace old ones later)
    {
      title: 'Scholarity',
      items: [
        { tab: 'planning', label: 'Planning' },
        { tab: 'studentPresence', label: 'Student Presence' },
        { tab: 'studentNotes', label: 'Student Notes' },
        { tab: 'studentReportDetails', label: 'Student Report Details' },
        { tab: 'classCourses', label: 'Class Courses' },

      ],
    },
    {
      title: 'Administration',
      items: [
        { tab: 'students', label: 'Students' },
        { tab: 'teachers', label: 'Teachers' },
        { tab: 'classStudents', label: 'Class Students' },
        { tab: 'users', label: 'Users' },
        { tab: 'companies', label: 'Companies' },
      ],
    },
    {
      title: 'Settings',
      items: [],
    },
    // {
    //   title: 'Finance',
    //   items: [],
    // },
    {
      title: 'Direction',
      items: [],
    },
    {
      title: 'Professeur',
      items: [],
    },
    {
      title: 'Eleve',
      items: [],
    },
    {
      title: 'Parent',
      items: [],
    },
    {
      title: 'Support',
      items: [
        { tab: 'schoolYears', label: 'School Years' },
        { tab: 'classRooms', label: 'Class Rooms' },
        { tab: 'programs', label: 'Programs' },
        { tab: 'modules', label: 'Modules' },
        { tab: 'courses', label: 'Courses' },

      ],
    },

   
  
  
   
   
   
   
  ];

  return (
    <div className="min-h-screen bg-surface">
      {/* Overlay for mobile */}
      <div
        className={`fixed left-0 right-0 top-16 bottom-0 bg-black/30 z-30 sm:hidden transition-opacity ${
          isMobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobile}
      />
      <div
        className={`w-64 bg-white shadow-lg fixed left-0 top-16 z-40 transform transition-transform ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'sm:-translate-x-full' : 'sm:translate-x-0'}`}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-heading">Edusol</h2>
            <div className="flex items-center gap-2">
              {onToggleCollapse && (
                <button
                  type="button"
                  aria-label={isCollapsed ? 'Show sidebar' : 'Hide sidebar'}
                  className="hidden sm:inline-flex items-center justify-center rounded-full border border-border p-2 text-muted hover:bg-primary-transparent hover:text-primary transition"
                  onClick={onToggleCollapse}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
                    />
                  </svg>
                </button>
              )}
              {/* Close button on mobile */}
              <button
                type="button"
                aria-label="Close sidebar"
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-primary-transparent-50 hover:text-primary transition-colors"
                onClick={closeMobile}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>



          {/* Parameters Section */}
          <div className="mb-6 flex-1 overflow-y-auto pr-2">
            <button
              onClick={toggleParameters}
              className="w-full text-left px-4 py-3 rounded-lg font-medium transition-colors text-heading hover:bg-primary-transparent hover:text-primary"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Parameters
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isParametersOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {/* Dropdown Content */}
            {isParametersOpen && (
              <div className="mt-2 space-y-3 pb-8">
                {parameterGroups.map((group) => {
                  const isGroupOpen = openGroups[group.title] ?? true;
                  return (
                    <div key={group.title} className="space-y-1">
                      <button
                        onClick={() => toggleGroup(group.title)}
                        className="flex w-full items-center justify-between rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted hover:bg-primary-transparent hover:text-primary transition-colors"
                      >
                        <span>{group.title}</span>
                        <svg
                          className={`h-4 w-4 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isGroupOpen && (
                        <div className="ml-4 space-y-1 border-l border-border pl-4">
                          {group.items.map((item) => {
                            const route = tabToRoutePath(item.tab);
                            const isActive = currentRouteTab === item.tab;
                            return (
                              <Link
                                key={item.tab}
                                to={route}
                                onClick={() => {
                                  onTabChange(item.tab);
                                  closeMobile();
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  isActive
                                    ? 'bg-primary-transparent text-primary font-medium'
                                    : 'text-muted hover:bg-primary-transparent hover:text-primary'
                                }`}
                              >
                                {item.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settings Link */}
          <div className="mt-auto pt-4 border-t border-border">
            <Link
              to="/settings"
              onClick={closeMobile}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-primary-transparent text-primary'
                  : 'text-muted hover:bg-primary-transparent hover:text-primary'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
