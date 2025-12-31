import React, { useState } from 'react';
import ColorSettings from '../components/settings/ColorSettings';
import PageAccessSettings from '../components/settings/PageAccessSettings';

type SettingsTab = 'colors' | 'access';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('colors');

  const tabs: Array<{ id: SettingsTab; label: string }> = [
    { id: 'colors', label: 'Colors' },
    { id: 'access', label: 'Page Access' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-sm text-gray-600">Manage your company settings and page access</p>
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
      </div>
    </div>
  );
};

export default SettingsPage;

