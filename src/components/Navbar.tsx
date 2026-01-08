import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { getFileUrl } from '../utils/apiConfig';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const company = user?.company;
  const companyLogo = company?.logo;

  const rawUser = user as { username?: string; email?: string } | null;
  const displayName = rawUser?.username || rawUser?.email || 'User';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk: string) => chunk[0])
    .join('')
    .toUpperCase();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Helper function to darken a hex color
  const darkenColor = (hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - percent / 100)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - percent / 100)));
    const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - percent / 100)));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Get navbar background gradient - use company colors when logged in, default colors otherwise
  const navbarBackground = useMemo(() => {
    if (user && company) {
      // When logged in, use company colors
      const primaryColor = company.primaryColor || '#2563eb';
      const secondaryColor = company.secondaryColor || '#0ea5e9';
      
      // Create a gradient: darker primary -> primary -> secondary
      // Only darken if it's a hex color
      let startColor = primaryColor;
      if (primaryColor.startsWith('#')) {
        startColor = darkenColor(primaryColor, 20);
      }
      
      return `linear-gradient(135deg, ${startColor} 0%, ${primaryColor} 50%, ${secondaryColor} 100%)`;
    }
    // Default gradient when not logged in
    return 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)';
  }, [user, company]);

  // Get border color - use primary color when logged in
  const borderColor = useMemo(() => {
    if (user && company?.primaryColor) {
      const primaryColor = company.primaryColor;
      // For hex colors, add opacity using color-mix or rgba conversion
      if (primaryColor.startsWith('#')) {
        // Convert hex to rgba with 30% opacity
        const hex = primaryColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.3)`;
      }
      // For rgb/rgba colors, adjust opacity
      if (primaryColor.startsWith('rgb')) {
        return primaryColor.replace(/rgba?\(([^)]+)\)/, (match, values) => {
          const colors = values.split(',').map((v: string) => v.trim());
          if (colors.length === 3) {
            return `rgba(${colors.join(', ')}, 0.3)`;
          }
          return match;
        });
      }
      return primaryColor;
    }
    return 'rgba(30, 58, 138, 0.3)'; // Default blue-900/30
  }, [user, company]);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 text-white shadow-md"
      style={{
        background: navbarBackground,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {/* Mobile: sidebar toggle */}
            <button
              type="button"
              aria-label={t('navbar.openSidebar')}
              className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/50 sm:hidden"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              {user && companyLogo ? (
                <img
                  src={getFileUrl(companyLogo)}
                  alt={company?.name || 'Company logo'}
                  className="h-10 w-auto max-w-[200px] object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                />
              ) : (
                <img
                  src="/edusol_logo.png"
                  alt="Edusol - La fiabilité à portée de main"
                  className="h-12 w-auto object-contain drop-shadow-[5px_5px_15px_rgba(255,255,255,2)]"
                />
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-2 rounded-md text-sm font-medium bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/35 transition-all text-white shadow-sm"
              title={t('language.switchLanguage')}
            >
              {i18n.language === 'en' ? 'FR' : 'EN'}
            </button>
            {user ? (
              <>
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  <span className="text-sm font-semibold text-white">{displayName}</span>
                  <span className="text-xs text-blue-100">{t('navbar.welcomeBack')}</span>
                </div>
                <Link
                  to="/profile"
                  className="h-10 w-10 flex items-center justify-center rounded-full bg-white/15 text-sm font-semibold uppercase hover:bg-white/25 transition-all cursor-pointer text-white shadow-sm"
                  title={t('navbar.viewProfile')}
                >
                  {initials || 'U'}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white/15 border border-white/25 hover:bg-white/25 hover:border-white/35 transition-all text-white shadow-sm"
                >
                  {t('navbar.logout')}
                </button>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link
                  to="/auth?mode=login"
                  className="px-4 py-2 rounded-md text-sm font-medium bg-white text-blue-700 shadow-md hover:bg-blue-50 hover:shadow-lg transition-all font-semibold"
                >
                  {t('navbar.login')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
