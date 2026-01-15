import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getFileUrl } from '../utils/apiConfig';
import { getProfileLabel } from '../types/profile';
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
    const userRoles = Array.isArray(user?.roles) ? user?.roles : [];
    const isStudent = userRoles.includes('student') || user?.profile === 'student';
    const isTeacher = userRoles.includes('teacher') || userRoles.includes('prof') || user?.profile === 'teacher' || user?.profile === 'prof';
    
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

  // Get navbar background gradient
  const navbarBackground = useMemo(() => {
    if (user && company) {
      const primaryColor = company.primaryColor || '#2563eb';
      const secondaryColor = company.secondaryColor || '#0ea5e9';
      
      let startColor = primaryColor;
      if (primaryColor.startsWith('#')) {
        const num = parseInt(primaryColor.replace('#', ''), 16);
        const r = Math.max(0, Math.floor((num >> 16) * 0.8));
        const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * 0.8));
        const b = Math.max(0, Math.floor((num & 0x0000ff) * 0.8));
        startColor = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
      
      return `linear-gradient(135deg, ${startColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
    }
    return 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #0ea5e9 100%)';
  }, [user, company]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-14 bg-white/5 backdrop-blur-md border-b border-white/10"
      style={{
        background: navbarBackground,
      }}
    >
      <div className="h-full max-w-[1920px] mx-auto px-[21px] sm:px-[29px] lg:px-[45px] pl-[27px] sm:pl-[33px] lg:pl-[55px]">
        <div className="h-full flex items-center justify-between">
          {/* Left: Logo & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              className="sm:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label={t('navbar.openSidebar')}
            >
              <Menu className="h-5 w-5 text-white" />
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
                  className="h-8 w-auto max-w-[180px] object-contain transition-opacity group-hover:opacity-90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                />
              ) : (
                <img
                  src="/edusol_logo.png"
                  alt="Edusol"
                  className="h-9 w-auto object-contain transition-opacity group-hover:opacity-90 drop-shadow-[3px_5px_9px_rgba(255,255,255,1.5)]"
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
                  className="p-2 rounded-lg hover:bg-white/10 transition-all duration-200 group relative"
                  title={t('language.switchLanguage')}
                  aria-label={t('language.switchLanguage')}
                >
                  <Globe className="h-5 w-5 text-white/90 group-hover:text-white transition-colors" />
                  <span className="absolute -top-1 -right-1 text-[10px] font-medium text-white bg-white/20 rounded-full px-1.5 py-0.5">
                    {i18n.language === 'en' ? 'EN' : 'FR'}
                  </span>
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/50 via-blue-500/50 to-purple-500/50 blur-md" />
                      <div className="relative h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold shadow-lg border-2 border-white/20">
                        {initials || 'U'}
                      </div>
                    </div>

                    {/* User Info - Hidden on mobile */}
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-semibold text-white leading-tight">
                        {displayName}
                      </span>
                      <span className="text-xs text-white/70 leading-tight">
                        {userRoleLabel}
                      </span>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 text-white/70 transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                            {initials || 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {displayName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
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
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{t('navbar.profile')}</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-gray-400" />
                          <span>{t('navbar.settings')}</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 pt-1">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                className="px-4 py-2 rounded-lg bg-white text-blue-600 font-medium text-sm hover:bg-blue-50 transition-colors shadow-sm"
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
