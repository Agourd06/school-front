/**
 * Application Routes Configuration
 * 
 * This file defines all routes in the application.
 * Routes are automatically initialized in the database on app startup.
 * 
 * NOTE: Pages are now global and shared across all companies.
 */

export interface RouteDefinition {
  route: string;
  title: string;
}

/**
 * All application routes organized by category
 */
export const APP_ROUTES: RouteDefinition[] = [
  // Dashboard routes (Admin/Support)
  { route: '/dashboard', title: 'Dashboard' },
  { route: '/programs', title: 'Programs' },
  { route: '/specializations', title: 'Specializations' },
  { route: '/levels', title: 'Levels' },
  { route: '/school-years', title: 'School Years' },
  { route: '/school-year-periods', title: 'School Year Periods' },
  { route: '/classes', title: 'Classes' },
  { route: '/courses', title: 'Courses' },
  { route: '/modules', title: 'Modules' },
  { route: '/class-rooms', title: 'Class Rooms' },
  { route: '/students', title: 'Students' },
  { route: '/class-students', title: 'Class Students' },
  { route: '/planning', title: 'Planning' },
  { route: '/student-reports', title: 'Student Reports' },
  { route: '/student-presence', title: 'Student Presence' },
  { route: '/student-notes', title: 'Student Notes' },
  { route: '/student-report-details', title: 'Student Report Details' },
  { route: '/planning-session-types', title: 'Planning Session Types' },
  { route: '/teachers', title: 'Teachers' },
  { route: '/administrators', title: 'Administrators' },
  { route: '/student-link-types', title: 'Student Link Types' },
  { route: '/student-contacts', title: 'Student Contacts' },
  { route: '/student-diplomes', title: 'Student Diplomes' },
  { route: '/level-pricings', title: 'Level Pricings' },
  { route: '/student-payments', title: 'Student Payments' },
  { route: '/attestations', title: 'Attestations' },
  { route: '/student-attestations', title: 'Student Attestations' },
  { route: '/class-courses', title: 'Class Courses' },
  { route: '/users', title: 'Users' },
  { route: '/companies', title: 'Companies' },
  { route: '/settings', title: 'Settings' },
  { route: '/settings/colors', title: 'Settings - Colors' },
  { route: '/settings/access', title: 'Settings - Page Access' },
  { route: '/settings/roles', title: 'Settings - Roles' },
  { route: '/settings/company', title: 'Settings - Company' },
  { route: '/settings/types', title: 'Settings - Types' },
  { route: '/settings/types/link', title: 'Settings - Link Types' },
  { route: '/settings/types/classroom', title: 'Settings - Classroom Types' },
  { route: '/settings/types/planning', title: 'Settings - Planning Types' },
  { route: '/roles', title: 'Roles' },
  { route: '/profile', title: 'Profile' },

  // Student routes
  { route: '/student', title: 'Student Dashboard' },
  { route: '/student/schedule', title: 'Student Schedule' },
  { route: '/student/grades', title: 'Student Grades' },
  { route: '/student/attendance', title: 'Student Attendance' },
  { route: '/student/attestations', title: 'Student Attestations' },
  { route: '/student/profile', title: 'Student Profile' },

  // Teacher routes
  { route: '/teacher', title: 'Teacher Dashboard' },
  { route: '/teacher/plannings', title: 'Teacher Plannings' },
  { route: '/teacher/attendance', title: 'Teacher Attendance' },
  { route: '/teacher/grades', title: 'Teacher Grades' },
  { route: '/teacher/links', title: 'Teacher Links' },
  { route: '/teacher/profile', title: 'Teacher Profile' },
  { route: '/teacher/homework', title: 'Teacher Homework' },
];

/**
 * Get routes by category (for organization purposes)
 */
export const getDashboardRoutes = (): RouteDefinition[] => {
  return APP_ROUTES.filter(r => 
    !r.route.startsWith('/student') && 
    !r.route.startsWith('/teacher') &&
    !r.route.startsWith('/auth') &&
    !r.route.startsWith('/register') &&
    !r.route.startsWith('/reset') &&
    !r.route.startsWith('/set-password') &&
    r.route !== '/unauthorized'
  );
};

export const getStudentRoutes = (): RouteDefinition[] => {
  return APP_ROUTES.filter(r => r.route.startsWith('/student'));
};

export const getTeacherRoutes = (): RouteDefinition[] => {
  return APP_ROUTES.filter(r => r.route.startsWith('/teacher'));
};
