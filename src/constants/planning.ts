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
  0: 'bg-slate-100 text-slate-700 border border-slate-200',
  1: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  2: 'bg-amber-50 text-amber-700 border border-amber-200',
  [-1]: 'bg-blue-50 text-blue-700 border border-blue-200',
  [-2]: 'bg-red-50 text-red-700 border border-red-200',
};

export const PLANNING_STATUS_LABEL: Record<number, string> = {
  0: 'Disabled',
  1: 'Active',
  2: 'Pending',
  [-1]: 'Archived',
  [-2]: 'Deleted',
};

/** New sessions default to PENDING; presence can be edited until activated. */
export const DEFAULT_PLANNING_STATUS: PlanningStatus = 2; // Pending by default

/** Once activated, presence is read-only (session status = Active). */
export const PLANNING_STATUS_ACTIVATED: PlanningStatus = 1;


