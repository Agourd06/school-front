import React from 'react';
import { useTranslation } from 'react-i18next';

type StatusValue = number | null | undefined;

interface UserStatusBadgeProps {
  value: StatusValue;
}

const STATUS_STYLES: Record<number, { labelKey: string; className: string }> = {
  1: { labelKey: 'forms.active', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  2: { labelKey: 'forms.pending', className: 'bg-orange-50 text-orange-700 border border-orange-200' }, // Soft orange for pending
  0: { labelKey: 'forms.disabled', className: 'bg-slate-100 text-slate-600 border border-slate-200' }, // Gray for disabled/suspended
  [-1]: { labelKey: 'forms.archived', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
  [-2]: { labelKey: 'forms.deleted', className: 'bg-red-50 text-red-700 border border-red-200' },
};

const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ value }) => {
  const { t } = useTranslation();
  const info = (value != null && STATUS_STYLES[value as number]) || {
    labelKey: 'forms.unknown',
    className: 'bg-gray-100 text-gray-800 border border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
      {t(info.labelKey)}
    </span>
  );
};

export default UserStatusBadge;
