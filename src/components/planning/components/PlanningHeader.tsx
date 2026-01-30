import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../ui';
import { Calendar, Plus } from 'lucide-react';
import type { PlanningHeaderProps, PlanningViewMode } from '../types';

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ viewMode, onViewModeChange, addPlanningHref }) => {
  const { t } = useTranslation();
  
  const modes: Array<{ id: PlanningViewMode; labelKey: string }> = [
    { id: 'week', labelKey: 'planning.week' },
    { id: 'month', labelKey: 'planning.month' },
  ];

  return (
    <>
      <PageHeader
        titleKey="pages.planningTitle"
        descriptionKey="pages.planningDescription"
        icon={<Calendar className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => onViewModeChange(mode.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    viewMode === mode.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {t(mode.labelKey)}
                </button>
              ))}
            </div>
            {addPlanningHref && (
              <Link
                to={addPlanningHref}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm text-white bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-md"
                aria-label={t('planning.addPlanningFromClassCourse') || 'Go to class courses to add planning'}
              >
                <Plus className="w-5 h-5" />
                <span>{t('planning.addPlanning') || 'Add planning'}</span>
              </Link>
            )}
          </div>
        }
      />
    </>
  );
};

export default PlanningHeader;


