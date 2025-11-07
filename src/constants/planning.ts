export type PlanningStatus = 'planned' | 'completed' | 'cancelled' | 'postponed';

export const PLANNING_STATUS_OPTIONS: Array<{ value: PlanningStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
];

export const PLANNING_STATUS_STYLES: Record<PlanningStatus, { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
  postponed: { label: 'Postponed', className: 'bg-yellow-100 text-yellow-800' },
};

export const DEFAULT_PLANNING_STATUS: PlanningStatus = 'planned';


