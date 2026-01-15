import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../Navbar';
import { useAuth } from '../../hooks/useAuth';

interface StudentLayoutProps {
  children: React.ReactNode;
}

/**
 * Clean student layout without sidebar
 * Features:
 * - Top navigation bar
 * - Simple bottom navigation for student pages
 * - Clean, modern UI/UX
 */
const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/student', label: 'Dashboard', icon: '📊' },
    { path: '/student/schedule', label: 'Schedule', icon: '📅' },
    { path: '/student/grades', label: 'Grades', icon: '📝' },
    { path: '/student/attendance', label: 'Attendance', icon: '✓' },
    { path: '/student/attestations', label: 'Attestations', icon: '📜' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      
      {/* Main Content */}
      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.username || 'Student'}!
            </h1>
            <p className="text-gray-600">Here's your academic overview</p>
          </div>

          {/* Page Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive(item.path)
                    ? 'text-primary border-t-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default StudentLayout;

