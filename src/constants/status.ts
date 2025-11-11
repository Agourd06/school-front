export const STATUS_OPTIONS = [
  { value: 0, label: 'Disabled' },
  { value: 1, label: 'Active' },
  { value: 2, label: 'Pending' },
  { value: -1, label: 'Archived' },
  { value: -2, label: 'Deleted' },
];

export const STATUS_OPTIONS_FORM = STATUS_OPTIONS.filter(option => option.value !== -2);

export const DEFAULT_COMPANY_ID = 1;

export const STATUS_VALUE_LABEL: Record<number, string> = {
  [-2]: 'Deleted',
  [-1]: 'Archived',
  [0]: 'Disabled',
  [1]: 'Active',
  [2]: 'Pending',
};


