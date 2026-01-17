import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { PageHeader } from '../components/ui';
import { Settings } from 'lucide-react';
import { usePermissions } from '../utils/permissions';

type SettingsTab = 'colors' | 'access' | 'types' | 'roles' | 'company' | 'users';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPageAccess, allowedPages } = usePermissions();

  // Determine active tab from URL
  const getActiveTab = (): SettingsTab => {
    const path = location.pathname;
    if (path.startsWith('/settings/types')) return 'types';
    if (path === '/settings/access' || path === '/settings/page-access') return 'access';
    if (path === '/settings/roles') return 'roles';
    if (path === '/settings/company') return 'company';
    if (path === '/settings/user') return 'users';
    if (path === '/settings/colors' || path === '/settings') return 'colors';
    return 'colors'; // default
  };

  const activeTab = getActiveTab();

  const tabs = useMemo(() => {
    // Check types access explicitly - user must have at least one types sub-tab
    const hasLinkAccess = hasPageAccess('/settings/types/link');
    const hasClassroomAccess = hasPageAccess('/settings/types/classroom');
    const hasPlanningAccess = hasPageAccess('/settings/types/planning');
    const hasTypesAccess = hasLinkAccess || hasClassroomAccess || hasPlanningAccess;
    
    return [
      {
        id: 'colors' as const,
        label: t('settings.colors'),
        path: '/settings/colors',
        isAllowed: hasPageAccess('/settings/colors'),
      },
      {
        id: 'access' as const,
        label: t('settings.pageAccess'),
        path: '/settings/access',
        isAllowed: hasPageAccess('/settings/access') || hasPageAccess('/settings/page-access'),
      },
      {
        id: 'types' as const,
        label: t('settings.types'),
        path: '/settings/types',
        isAllowed: hasTypesAccess, // Only show if user has at least one types sub-tab
      },
      {
        id: 'roles' as const,
        label: t('settings.roles'),
        path: '/settings/roles',
        isAllowed: hasPageAccess('/settings/roles'),
      },
      {
        id: 'company' as const,
        label: t('settings.company') || 'Company',
        path: '/settings/company',
        isAllowed: hasPageAccess('/settings/company'),
      },
      {
        id: 'users' as const,
        label: t('settings.users') || 'Users',
        path: '/settings/user',
        isAllowed: hasPageAccess('/settings/user'),
      },
    ];
  }, [hasPageAccess, t, allowedPages]);

  const allowedTabs = useMemo(() => tabs.filter((tab) => tab.isAllowed), [tabs]);

  useEffect(() => {
    if (allowedTabs.length === 0) {
      return;
    }

    const isOnSettingsRoot = location.pathname === '/settings';
    const isActiveAllowed = allowedTabs.some((tab) => tab.id === activeTab);

    // CRITICAL: If user is on /settings/types but doesn't have access, redirect immediately
    if (location.pathname.startsWith('/settings/types') && !allowedTabs.some((tab) => tab.id === 'types')) {
      navigate(allowedTabs[0].path, { replace: true });
      return;
    }

    if (isOnSettingsRoot || !isActiveAllowed) {
      navigate(allowedTabs[0].path, { replace: true });
    }
  }, [activeTab, allowedTabs, location.pathname, navigate]);

  if (allowedTabs.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          titleKey="pages.settingsTitle"
          descriptionKey="pages.settingsDescription"
          icon={<Settings className="w-5 h-5" />}
        />
        <div className="bg-white rounded-xl border border-primary/20 shadow-md p-6 text-center">
          <h3 className="text-lg font-semibold text-heading mb-2">
            {t('settings.noAccessTitle') || 'No settings access'}
          </h3>
          <p className="text-sm text-body">
            {t('settings.noAccessMessage') || 'You do not have access to any Settings tabs.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.settingsTitle"
        descriptionKey="pages.settingsDescription"
        icon={<Settings className="w-5 h-5" />}
      />

      {/* Tabs */}
      <div className="border-b border-tertiary/20 bg-white rounded-t-xl">
        <nav className="-mb-px flex space-x-8">
          {allowedTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-tertiary text-secondary font-semibold'
                  : 'border-transparent text-muted hover:text-secondary hover:border-tertiary/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsPage;

