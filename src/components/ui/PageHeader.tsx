import React from 'react';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  titleKey: string;
  descriptionKey: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  titleKey,
  descriptionKey,
  icon,
  actions,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-tertiary/20 bg-gradient-to-r from-white to-gray-50/50 pb-6 pt-1 mb-6 rounded-lg px-1">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            {icon && (
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
                {icon}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight whitespace-nowrap">
                {t(titleKey)}
              </h1>
              <span className="text-gray-400 text-lg">-</span>
              <p className="text-sm text-gray-600 leading-snug pt-0.5">
                {t(descriptionKey)}
              </p>
            </div>
          </div>
        </div>
        {actions && (
          <div className="flex items-center gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
