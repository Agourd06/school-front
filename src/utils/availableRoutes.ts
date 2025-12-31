/**
 * Available routes in the application
 * Used for creating pages in the page access management system
 */
import { tabToRoute } from './routeMapping';

export interface AvailableRoute {
  title: string;
  route: string;
  tab?: string;
}

/**
 * Get all available routes from the route mapping
 * These are the routes that can be registered as pages
 */
export const getAvailableRoutes = (): AvailableRoute[] => {
  // Convert route mapping to available routes with human-readable titles
  const routeTitles: Record<string, string> = {
    '/users': 'Users',
    '/companies': 'Companies',
    '/programs': 'Programs',
    '/specializations': 'Specializations',
    '/levels': 'Levels',
    '/classes': 'Classes',
    '/class-students': 'Class Students',
    '/planning': 'Planning',
    '/student-reports': 'Student Reports',
    '/student-presence': 'Student Presence',
    '/student-notes': 'Student Notes',
    '/student-report-details': 'Student Report Details',
    '/planning-session-types': 'Planning Session Types',
    '/level-pricings': 'Level Pricings',
    '/student-payments': 'Student Payments',
    '/courses': 'Courses',
    '/modules': 'Modules',
    '/school-years': 'School Years',
    '/school-year-periods': 'School Year Periods',
    '/class-rooms': 'Class Rooms',
    '/students': 'Students',
    '/teachers': 'Teachers',
    '/administrators': 'Administrators',
    '/student-link-types': 'Student Link Types',
    '/student-contacts': 'Student Contacts',
    '/student-diplomes': 'Student Diplomes',
    '/attestations': 'Attestations',
    '/student-attestations': 'Student Attestations',
    '/class-courses': 'Class Courses',
    '/settings': 'Settings',
    '/dashboard': 'Dashboard',
  };

  // Get all routes from routeMapping
  const routes: AvailableRoute[] = Object.entries(tabToRoute).map(([tab, route]) => ({
    title: routeTitles[route] || formatRouteTitle(route),
    route,
    tab,
  }));

  // Add additional routes not in routeMapping
  const additionalRoutes: AvailableRoute[] = [
    { title: 'Settings', route: '/settings' },
    { title: 'Dashboard', route: '/dashboard' },
  ];

  // Combine and remove duplicates
  const allRoutes = [...routes, ...additionalRoutes];
  const uniqueRoutes = Array.from(
    new Map(allRoutes.map((r) => [r.route, r])).values()
  );

  return uniqueRoutes.sort((a, b) => a.title.localeCompare(b.title));
};

/**
 * Format a route path into a readable title
 * Example: '/student-reports' -> 'Student Reports'
 */
const formatRouteTitle = (route: string): string => {
  return route
    .replace(/^\//, '') // Remove leading slash
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

