export type PlanningStatus = number; // 0: disabled, 1: active, 2: pending, -1: archived, -2: deleted

export const PLANNING_STATUS_OPTIONS: Array<{ value: PlanningStatus; label: string }> = [
  { value: 0, label: 'Disabled' },
  { value: 1, label: 'Active' },
  { value: 2, label: 'Pending' },
  { value: -1, label: 'Archived' },
  // -2 (Deleted) is excluded from options as it's a soft delete status
];

export const PLANNING_STATUS_OPTIONS_FORM = PLANNING_STATUS_OPTIONS.filter(option => option.value !== -2);

export const PLANNING_STATUS_STYLES: Record<number, string> = {
  0: 'bg-gray-100 text-gray-800',
  1: 'bg-green-100 text-green-800',
  2: 'bg-yellow-100 text-yellow-800',
  [-1]: 'bg-purple-100 text-purple-800',
  [-2]: 'bg-red-100 text-red-800',
};

export const PLANNING_STATUS_LABEL: Record<number, string> = {
  0: 'Disabled',
  1: 'Active',
  2: 'Pending',
  [-1]: 'Archived',
  [-2]: 'Deleted',
};

export const DEFAULT_PLANNING_STATUS: PlanningStatus = 1; // Active by default


