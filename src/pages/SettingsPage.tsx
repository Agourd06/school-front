import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import ColorSettings from '../components/settings/ColorSettings';
import PageAccessSettings from '../components/settings/PageAccessSettings';
import TypesSettings from '../components/settings/TypesSettings';
import RolesSettings from '../components/settings/RolesSettings';
import { PageHeader } from '../components/ui';
import { Settings } from 'lucide-react';

type SettingsTab = 'colors' | 'access' | 'types' | 'roles';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const getActiveTab = (): SettingsTab => {
    const path = location.pathname;
    if (path.startsWith('/settings/types')) return 'types';
    if (path === '/settings/access' || path === '/settings/page-access') return 'access';
    if (path === '/settings/roles') return 'roles';
    if (path === '/settings/colors' || path === '/settings') return 'colors';
    return 'colors'; // default
  };

  const activeTab = getActiveTab();

  const tabs: Array<{ id: SettingsTab; label: string; path: string }> = [
    { id: 'colors', label: t('settings.colors'), path: '/settings/colors' },
    { id: 'access', label: t('settings.pageAccess'), path: '/settings/access' },
    { id: 'types', label: t('settings.types'), path: '/settings/types' },
    { id: 'roles', label: t('settings.roles'), path: '/settings/roles' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.settingsTitle"
        descriptionKey="pages.settingsDescription"
        icon={<Settings className="w-5 h-5" />}
      />

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-xl">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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

