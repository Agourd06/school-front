import React from 'react';
import { useTranslation } from 'react-i18next';

type StatusValue = number | null | undefined;

const STATUS_STYLES: Record<number, { labelKey: string; className: string }> = {
  1: { labelKey: 'forms.active', className: 'bg-green-100 text-green-800' },
  2: { labelKey: 'forms.pending', className: 'bg-yellow-100 text-yellow-800' },
  0: { labelKey: 'forms.disabled', className: 'bg-gray-100 text-gray-800' },
  [-1]: { labelKey: 'forms.archived', className: 'bg-blue-100 text-blue-800' },
  [-2]: { labelKey: 'forms.deleted', className: 'bg-red-100 text-red-800' },
};

interface StatusBadgeProps {
  value: StatusValue;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ value }) => {
  const { t } = useTranslation();
  const info = (value != null && STATUS_STYLES[value as number]) || {
    labelKey: 'forms.unknown',
    className: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>
      {t(info.labelKey)}
    </span>
  );
};

export default StatusBadge;


