import React from 'react';

type StatusValue = number | null | undefined;

const STATUS_STYLES: Record<number, { label: string; className: string }> = {
  1: { label: 'Active', className: 'bg-green-100 text-green-800' },
  2: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
  0: { label: 'Disabled', className: 'bg-gray-100 text-gray-800' },
  [-1]: { label: 'Archived', className: 'bg-blue-100 text-blue-800' },
  [-2]: { label: 'Deleted', className: 'bg-red-100 text-red-800' },
};

interface StatusBadgeProps {
  value: StatusValue;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ value }) => {
  const info = (value != null && STATUS_STYLES[value as number]) || {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.className}`}>
      {info.label}
    </span>
  );
};

export default StatusBadge;


