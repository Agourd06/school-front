import React from 'react';
import { PLANNING_STATUS_STYLES, PLANNING_STATUS_LABEL, type PlanningStatus } from '../constants/planning';

interface PlanningStatusBadgeProps {
  status: PlanningStatus;
}

const PlanningStatusBadge: React.FC<PlanningStatusBadgeProps> = ({ status }) => {
  const statusNum = typeof status === 'number' ? status : 1; // Default to active (1) if invalid
  const className = PLANNING_STATUS_STYLES[statusNum] || PLANNING_STATUS_STYLES[1];
  const label = PLANNING_STATUS_LABEL[statusNum] || PLANNING_STATUS_LABEL[1];

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>
      {label}
    </span>
  );
};

export default PlanningStatusBadge;


