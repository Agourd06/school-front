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
    <div className="border-b border-gray-200 bg-gradient-to-r from-white to-gray-50/50 pb-6 mb-6 rounded-lg px-1">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                {icon}
              </div>
            )}
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {t(titleKey)}
            </h1>
          </div>
          <p className="text-base text-gray-600 leading-relaxed ml-0 lg:ml-[59px]">
            {t(descriptionKey)}
          </p>
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
