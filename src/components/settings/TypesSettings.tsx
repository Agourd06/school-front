import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import StudentLinkTypesSection from '../sections/StudentLinkTypesSection';
import ClassRoomTypesSection from './ClassRoomTypesSection';
import PlanningSessionTypesSection from '../sections/PlanningSessionTypesSection';

type TypesSubTab = 'linkTypes' | 'classRoomTypes' | 'planningSessionTypes';

const TypesSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active sub-tab from URL
  const getActiveSubTab = (): TypesSubTab => {
    const path = location.pathname;
    if (path === '/settings/types/link' || path === '/settings/types/link-types') return 'linkTypes';
    if (path === '/settings/types/classroom' || path === '/settings/types/classroom-types') return 'classRoomTypes';
    if (path === '/settings/types/planning' || path === '/settings/types/planning-session-types') return 'planningSessionTypes';
    // Default to linkTypes if on /settings/types (will be redirected)
    return 'linkTypes';
  };

  const activeSubTab = getActiveSubTab();

  const subTabs: Array<{ id: TypesSubTab; label: string; path: string }> = [
    { id: 'linkTypes', label: t('settings.linkTypes'), path: '/settings/types/link' },
    { id: 'classRoomTypes', label: t('settings.classRoomTypes'), path: '/settings/types/classroom' },
    { id: 'planningSessionTypes', label: t('settings.planningSessionTypes'), path: '/settings/types/planning' },
  ];

  // Redirect /settings/types to /settings/types/link if no sub-route
  useEffect(() => {
    if (location.pathname === '/settings/types') {
      navigate('/settings/types/link', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSubTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sub-tab Content */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default TypesSettings;

