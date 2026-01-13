import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ColorSettings from '../components/settings/ColorSettings';
import PageAccessSettings from '../components/settings/PageAccessSettings';
import TypesSettings from '../components/settings/TypesSettings';
import RolesSettings from '../components/settings/RolesSettings';

type SettingsTab = 'colors' | 'access' | 'types' | 'roles';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('colors');

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'colors', label: t('settings.colors') },
    { id: 'access', label: t('settings.pageAccess') },
    { id: 'types', label: t('settings.types') },
    { id: 'roles', label: t('settings.roles') },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('settings.settings')}</h1>
        <p className="text-sm text-gray-600">{t('settings.manageCompanySettings')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'colors' && <ColorSettings />}
        {activeTab === 'access' && <PageAccessSettings />}
        {activeTab === 'types' && <TypesSettings />}
        {activeTab === 'roles' && <RolesSettings />}
      </div>
    </div>
  );
};

export default SettingsPage;

