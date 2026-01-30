import React from 'react';
import { useTranslation } from 'react-i18next';

interface PageHeaderProps {
  titleKey: string;
  descriptionKey: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  middle?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  titleKey,
  icon,
  actions,
  middle,
}) => {
  const { t } = useTranslation();

  return (
    <div className="border-b border-tertiary/20 bg-gradient-to-r from-white to-gray-50/50 pb-6 pt-1 mb-6 rounded-lg px-1">
      <div className="flex items-center gap-4 flex-nowrap min-w-0">
        <div className="flex items-center gap-3 flex-shrink-0 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center text-secondary shadow-sm border border-secondary/10">
              {icon}
            </div>
          )}
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight whitespace-nowrap truncate">
            {t(titleKey)}
          </h1>
        </div>
        {middle && (
          <div className="flex-1 min-w-0 flex items-center justify-center overflow-hidden">
            {middle}
          </div>
        )}
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
