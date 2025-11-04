export const STATUS_OPTIONS = [
  { value: 0, label: 'Disabled (0)' },
  { value: 1, label: 'Active (1)' },
  { value: 2, label: 'Pending (2)' },
  { value: -1, label: 'Archived (-1)' },
  { value: -2, label: 'Deleted (-2)' },
];

export const DEFAULT_COMPANY_ID = 1;

export const STATUS_VALUE_LABEL: Record<number, string> = {
  [-2]: 'Deleted',
  [-1]: 'Archived',
  [0]: 'Disabled',
  [1]: 'Active',
  [2]: 'Pending',
};


