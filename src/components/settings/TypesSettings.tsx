import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { usePermissions } from '../../utils/permissions';

type TypesSubTab = 'linkTypes' | 'classRoomTypes' | 'planningSessionTypes';

const TypesSettings: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPageAccess } = usePermissions();

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

  const subTabs = useMemo(
    () => [
      {
        id: 'linkTypes' as const,
        label: t('settings.linkTypes'),
        path: '/settings/types/link',
        isAllowed: hasPageAccess('/settings/types/link'),
      },
      {
        id: 'classRoomTypes' as const,
        label: t('settings.classRoomTypes'),
        path: '/settings/types/classroom',
        isAllowed: hasPageAccess('/settings/types/classroom'),
      },
      {
        id: 'planningSessionTypes' as const,
        label: t('settings.planningSessionTypes'),
        path: '/settings/types/planning',
        isAllowed: hasPageAccess('/settings/types/planning'),
      },
    ],
    [hasPageAccess, t]
  );

  const allowedSubTabs = useMemo(() => subTabs.filter((tab) => tab.isAllowed), [subTabs]);

  useEffect(() => {
    if (allowedSubTabs.length === 0) {
      return;
    }

    const isOnTypesRoot = location.pathname === '/settings/types';
    const isActiveAllowed = allowedSubTabs.some((tab) => tab.id === activeSubTab);

    if (isOnTypesRoot || !isActiveAllowed) {
      navigate(allowedSubTabs[0].path, { replace: true });
    }
  }, [activeSubTab, allowedSubTabs, location.pathname, navigate]);

  if (allowedSubTabs.length === 0) {
    return (
      <div className="rounded-xl border border-tertiary/20 bg-white p-6 text-center">
        <h3 className="text-lg font-semibold text-heading mb-2">
          {t('settings.noAccessTitle') || 'No settings access'}
        </h3>
        <p className="text-sm text-body">
          {t('settings.noAccessMessage') || 'You do not have access to any Types settings.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="border-b border-tertiary/20">
        <nav className="-mb-px flex space-x-8">
          {allowedSubTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSubTab === tab.id
                  ? 'border-tertiary text-secondary'
                  : 'border-transparent text-muted hover:text-secondary hover:border-tertiary/40'
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

