import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getFileUrl } from '../utils/apiConfig';
import { getProfileLabel } from '../types/profile';
import { isStudentRole, isTeacherRole } from '../utils/permissions';
import { LogOut, User, Settings, ChevronDown, Menu, Globe } from 'lucide-react';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const company = user?.company;
  const companyLogo = company?.logo;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const rawUser = user as { username?: string; email?: string } | null;
  const displayName = rawUser?.username || rawUser?.email || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk: string) => chunk[0])
    .join('')
    .toUpperCase();

  // Get user role label
  const userRoleLabel = useMemo(() => {
    if (user?.profile) {
      return getProfileLabel(user.profile);
    }
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1);
    }
    return 'User';
  }, [user]);

  // Get profile link based on user roles/profile - students go to /student/profile, teachers to /teacher/profile, others to /profile
  // IMPORTANT: Check roles array first (new system), then profile (backwards compatibility)
  const profileLink = useMemo(() => {
    const userRoles = Array.isArray(user?.roles) 
      ? user.roles.map(r => String(r).toLowerCase().trim()).filter(Boolean)
      : [];
    const isStudent = isStudentRole(userRoles) || user?.profile === 'student';
    const isTeacher = isTeacherRole(userRoles) || user?.profile === 'teacher';
    
    if (isStudent) {
      return '/student/profile';
    }
    if (isTeacher) {
      return '/teacher/profile';
    }
    return '/profile';
  }, [user]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Get navbar background - uses tertiary color with very light tint (3% opacity)
  // This allows companies to customize navbar color while maintaining readability
  const [navbarBackground, setNavbarBackground] = React.useState('#ffffff');
  
  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number): string => {
    if (!hex.startsWith('#')) return '#ffffff';
    const num = parseInt(hex.replace('#', ''), 16);
    if (isNaN(num)) return '#ffffff';
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };
  
  // Update navbar background when company or CSS variable changes
  useEffect(() => {
    const updateBackground = () => {
      let tertiaryColor: string | null = null;
      
      // First, try to get tertiary color from company data
      const companyWithTertiary = company as { tertiaryColor?: string | null } | undefined;
      if (user && companyWithTertiary && companyWithTertiary.tertiaryColor) {
        tertiaryColor = companyWithTertiary.tertiaryColor;
      }
      
      // If not found in company data, try to get from CSS variable (set by theme system)
      if (!tertiaryColor && typeof window !== 'undefined') {
        const root = document.documentElement;
        const computed = getComputedStyle(root).getPropertyValue('--color-tertiary').trim();
        
        if (computed && computed.startsWith('#')) {
          tertiaryColor = computed;
        }
      }
      
      // Apply the color with 3% opacity, or use white as fallback
      if (tertiaryColor) {
        setNavbarBackground(hexToRgba(tertiaryColor, 0.03));
      } else {
        setNavbarBackground('#ffffff');
      }
    };
    
    // Initial update
    updateBackground();
    
    // Also listen for CSS variable changes (when theme is applied)
    const observer = new MutationObserver(() => {
      updateBackground();
    });
    
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['style'],
      });
      
      // Also check periodically in case CSS variable is set asynchronously
      const interval = setInterval(updateBackground, 100);
      
      return () => {
        observer.disconnect();
        clearInterval(interval);
      };
    }
    
    return () => observer.disconnect();
  }, [user, company]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-gray-100"
      style={{
        backgroundColor: navbarBackground,
      }}
    >
      <div className="h-full max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12">
        <div className="h-full flex items-center justify-between">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="sm:hidden p-2 rounded-md hover:bg-gray-50 transition-colors text-heading"
              aria-label={t('navbar.openSidebar')}
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo */}
            <Link
              to={user ? "/settings" : "/auth"}
              className="flex items-center gap-3 group"
            >
              {user && companyLogo ? (
                <img
                  src={getFileUrl(companyLogo)}
                  alt={company?.name || 'Company logo'}
                  className="h-8 w-auto max-w-[180px] object-contain transition-opacity group-hover:opacity-90"
                />
              ) : (
                <img
                  src="/edusol_logo.png"
                  alt="Edusol"
                  className="h-9 w-auto object-contain transition-opacity group-hover:opacity-90"
                />
              )}
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Language Switcher */}
                <button
                  onClick={toggleLanguage}
                  className="p-2 rounded-md hover:bg-gray-50 transition-all duration-200 group relative text-heading"
                  title={t('language.switchLanguage')}
                  aria-label={t('language.switchLanguage')}
                >
                  <Globe className="h-5 w-5 text-muted group-hover:text-heading transition-colors" />
                  <span className="absolute -top-0.5 -right-0.5 text-[10px] font-semibold text-white bg-primary rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {i18n.language === 'en' ? 'EN' : 'FR'}
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {initials || 'U'}
                      </div>
                    </div>

                    {/* User Info - Hidden on mobile */}
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-heading leading-tight">
                        {displayName}
                      </span>
                      <span className="text-xs text-muted leading-tight">
                        {userRoleLabel}
                      </span>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-muted transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                            {initials || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-heading truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {userRoleLabel}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          to={profileLink}
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-heading hover:bg-gray-50 transition-colors rounded-md mx-1"
                        >
                          <User className="h-4 w-4 text-muted" />
                          <span>{t('navbar.profile')}</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-heading hover:bg-gray-50 transition-colors rounded-md mx-1"
                        >
                          <Settings className="h-4 w-4 text-muted" />
                          <span>{t('navbar.settings')}</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1 mt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-md mx-1"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t('navbar.logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/auth?mode=login"
                className="px-4 py-2 rounded-md bg-primary text-white font-medium text-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors shadow-sm"
              >
                {t('navbar.login')}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
