import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tabToRoutePath, routePathToTab, type RouteTab } from "../utils/routeMapping";
import { usePermissions, isStudentRole, isTeacherRole } from "../utils/permissions";
import { useAuth } from "../hooks/useAuth";

interface SidebarProps {
  activeTab: RouteTab;
  onTabChange: (tab: RouteTab) => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

/**
 * Sidebar component for dashboard layout
 * SECURITY: This sidebar should NEVER be shown to students or teachers
 * They have their own layouts (StudentLayout, TeacherLayout) without sidebar
 */
const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onToggleCollapse,
  isCollapsed,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasPageAccess } = usePermissions();
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  // SECURITY: Sidebar should NEVER render for students or teachers
  // If this component somehow renders for them, return null immediately
  // This is a safety check in addition to DashboardLayout protection
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const userRoles = Array.isArray(user?.roles) 
    ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
    : [];
    const isStudent = isStudentRole(userRoles);
    const isTeacher = isTeacherRole(userRoles);
  
  if (isStudent || isTeacher) {
    return null; // Don't render anything - they should use their own layouts
  }

  // Define closeMobile early to ensure it's available everywhere
  const closeMobile = () => setIsMobileOpen(false);

  // Determine active tab from current route
  const currentRouteTab = routePathToTab(location.pathname) || activeTab;

  // Define parameter groups first (before using them in useMemo)
  const parameterGroups: Array<{
    title: string;
    titleKey: string;
    items: Array<{ tab: SidebarProps['activeTab']; labelKey: string }>;
  }> = [
  
    {
      title: 'Academic Setup',
      titleKey: 'sidebar.academicSetup',
      items: [
  
      ],
    },
    {
      title: 'Class Management',
      titleKey: 'sidebar.classManagement',
      items: [
        { tab: 'classes', labelKey: 'sidebar.classes' },
      ],
    },
    {
      title: 'Student',
      titleKey: 'sidebar.student',
      items: [
       
        { tab: 'administrators', labelKey: 'sidebar.administrators' },
        { tab: 'studentReports', labelKey: 'sidebar.studentReports' },
        { tab: 'studentContacts', labelKey: 'sidebar.studentContacts' },
        { tab: 'studentDiplomes', labelKey: 'sidebar.studentDiplomes' },
        { tab: 'attestations', labelKey: 'sidebar.attestations' },
        { tab: 'studentAttestations', labelKey: 'sidebar.studentAttestations' },
      ],
    },
    {
      title: 'Finance',
      titleKey: 'sidebar.finance',
      items: [
        { tab: 'levelPricings', labelKey: 'sidebar.levelPricings' },
        { tab: 'studentPayments', labelKey: 'sidebar.studentPayments' },
      ],
    },
    // New parameter groups (empty for now - will replace old ones later)
    {
      title: 'Scholarity',
      titleKey: 'sidebar.scholarity',
      items: [
        { tab: 'planning', labelKey: 'sidebar.planning' },
        { tab: 'studentPresence', labelKey: 'sidebar.studentPresence' },
        { tab: 'studentNotes', labelKey: 'sidebar.studentNotes' },
        { tab: 'studentReportDetails', labelKey: 'sidebar.studentReportDetails' },
        { tab: 'classCourses', labelKey: 'sidebar.classCourses' },

      ],
    },
    {
      title: 'Administration',
      titleKey: 'sidebar.administration',
      items: [
        { tab: 'students', labelKey: 'sidebar.students' },
        { tab: 'teachers', labelKey: 'sidebar.teachers' },
      ],
    },
    {
      title: 'Settings',
      titleKey: 'sidebar.settings',
      items: [],
    },
    // {
    //   title: 'Finance',
    //   items: [],
    // },
    {
      title: 'Direction',
      titleKey: 'sidebar.direction',
      items: [],
    },
    {
      title: 'Professeur',
      titleKey: 'sidebar.professor',
      items: [],
    },
    {
      title: 'Eleve',
      titleKey: 'sidebar.eleve',
      items: [],
    },
    {
      title: 'Parent',
      titleKey: 'sidebar.parent',
      items: [],
    },
    {
      title: 'Support',
      titleKey: 'sidebar.support',
      items: [
        { tab: 'schoolYears', labelKey: 'sidebar.schoolYears' },
        { tab: 'classRooms', labelKey: 'sidebar.classRooms' },
        { tab: 'programs', labelKey: 'sidebar.programs' },
        { tab: 'modules', labelKey: 'sidebar.modules' },
        { tab: 'courses', labelKey: 'sidebar.courses' },

      ],
    },

   
  
  
   
   
   
   
  ];

  // Filter menu items based on allowedPages (RBAC)
  // IMPORTANT: Even admin users must have pages in allowedPages - no bypass
  // The backend sets allowedPages based on role-page assignments
  // New admins only have /settings and /settings/user in allowedPages
  const filterMenuItems = useMemo(() => {
    return (items: Array<{ tab: SidebarProps['activeTab']; labelKey: string }>) => {
      // Filter items based on allowedPages (applies to all users, including admins)
      return items.filter((item) => {
        const route = tabToRoutePath(item.tab);
        return hasPageAccess(route);
      });
    };
  }, [hasPageAccess]);

  // Filter parameter groups to only show groups with accessible items
  const filteredParameterGroups = useMemo(() => {
    return parameterGroups.filter((group) => {
      // Filter groups: only show if they have at least one accessible item
      // This applies to all users, including admins
      const accessibleItems = filterMenuItems(group.items);
      return accessibleItems.length > 0;
    });
  }, [filterMenuItems, parameterGroups]);

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  useEffect(() => {
    const handler = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler as EventListener);
    return () => window.removeEventListener("toggle-sidebar", handler as EventListener);
  }, []);

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
            <img 
              src="/edusol_logo.png" 
              alt="Edusol" 
              className="h-10 w-auto object-contain"
            />
            <div className="flex items-center gap-2">
              {onToggleCollapse && (
                <button
                  type="button"
                  aria-label={isCollapsed ? t('sidebar.showSidebar') : t('sidebar.hideSidebar')}
                  className="hidden sm:inline-flex items-center justify-center rounded-full border border-tertiary p-2 text-muted hover:bg-secondary/5 hover:text-secondary transition"
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
                aria-label={t('sidebar.closeSidebar')}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-secondary/5 hover:text-secondary transition-colors"
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



          {/* Menu Groups - Displayed directly without Parameters wrapper */}
          <div className="mb-6 flex-1 overflow-y-auto pr-2 space-y-3 pb-8">
            {filteredParameterGroups.map((group) => {
              const isGroupOpen = openGroups[group.title] ?? true;
              const accessibleItems = filterMenuItems(group.items);
              
              // Don't render group if it has no accessible items
              if (accessibleItems.length === 0) {
                return null;
              }
              
              return (
                <div key={group.title} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm font-bold uppercase tracking-wide text-heading hover:bg-secondary/5 hover:text-secondary transition-colors"
                  >
                    <span className="font-bold">{t(group.titleKey)}</span>
                    <svg
                      className={`h-5 w-5 transition-transform ${isGroupOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {isGroupOpen && (
                    <div className="ml-4 space-y-1 border-l border-tertiary pl-4">
                      {accessibleItems.map((item) => {
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
                                ? 'bg-secondary/10 text-secondary font-medium border-l-2 border-secondary'
                                : 'text-muted hover:bg-secondary/5 hover:text-secondary'
                            }`}
                          >
                            {t(item.labelKey)}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Settings Link - Show if user has /settings page OR any settings sub-tab */}
          {(hasPageAccess('/settings') ||
            hasPageAccess('/settings/colors') ||
            hasPageAccess('/settings/access') ||
            hasPageAccess('/settings/roles') ||
            hasPageAccess('/settings/user') ||
            hasPageAccess('/settings/types/link') ||
            hasPageAccess('/settings/types/classroom') ||
            hasPageAccess('/settings/types/planning')) && (
            <div className="mt-auto pt-4 border-t border-tertiary/20">
              <Link
                to="/settings"
                onClick={closeMobile}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/settings')
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-muted hover:bg-primary/5 hover:text-primary'
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
                {t('sidebar.settings')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
