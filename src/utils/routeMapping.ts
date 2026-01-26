/**
 * Route mapping utilities for converting between route paths and tab names
 */

export type RouteTab =
  | 'users'
  | 'programs'
  | 'specializations'
  | 'levels'
  | 'classes'
  | 'classStudents'
  | 'planning'
  | 'studentReports'
  | 'studentPresence'
  | 'studentNotes'
  | 'studentReportDetails'
  | 'planningSessionTypes'
  | 'levelPricings'
  | 'studentPayments'
  | 'courses'
  | 'modules'
  | 'schoolYears'
  | 'schoolYearPeriods'
  | 'classRooms'
  | 'students'
  | 'teachers'
  | 'administrators'
  | 'studentLinkTypes'
  | 'studentContacts'
  | 'studentDiplomes'
  | 'attestations'
  | 'studentAttestations'
  | 'classCourses';

/**
 * Maps tab names to route paths
 */
export const tabToRoute: Record<RouteTab, string> = {
  users: '/settings/user',
  programs: '/programs',
  specializations: '/specializations',
  levels: '/levels',
  classes: '/classes',
  classStudents: '/class-students',
  planning: '/planning',
  studentReports: '/student-reports',
  studentPresence: '/student-presence',
  studentNotes: '/student-notes',
  studentReportDetails: '/student-report-details',
  planningSessionTypes: '/planning-session-types',
  levelPricings: '/level-pricings',
  studentPayments: '/student-payments',
  courses: '/courses',
  modules: '/modules',
  schoolYears: '/school-years',
  schoolYearPeriods: '/school-year-periods',
  classRooms: '/class-rooms',
  students: '/students',
  teachers: '/teachers',
  administrators: '/administrators',
  studentLinkTypes: '/student-link-types',
  studentContacts: '/student-contacts',
  studentDiplomes: '/student-diplomes',
  attestations: '/attestations',
  studentAttestations: '/student-attestations',
  classCourses: '/class-courses',
};

/**
 * Maps route paths to tab names
 */
export const routeToTab: Record<string, RouteTab> = Object.entries(tabToRoute).reduce(
  (acc, [tab, route]) => {
    acc[route] = tab as RouteTab;
    return acc;
  },
  {} as Record<string, RouteTab>
);

/**
 * Converts a tab name to a route path
 */
export const getRouteFromTab = (tab: RouteTab): string => {
  return tabToRoute[tab] || '/dashboard';
};

/**
 * Converts a route path to a tab name
 */
export const getTabFromRoute = (route: string): RouteTab | null => {
  return routeToTab[route] || null;
};

/**
 * Converts a route path (e.g., '/school-years') to a tab name (e.g., 'schoolYears')
 */
export const routePathToTab = (path: string): RouteTab | null => {
  // Remove leading slash
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Convert kebab-case to camelCase
  const tab = cleanPath
    .split('-')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
  
  return (tab as RouteTab) || null;
};

/**
 * Converts a tab name (e.g., 'schoolYears') to a route path (e.g., '/school-years')
 */
export const tabToRoutePath = (tab: RouteTab): string => {
  return tabToRoute[tab] || '/dashboard';
};

