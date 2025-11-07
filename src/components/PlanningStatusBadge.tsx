import React from 'react';
import { PLANNING_STATUS_STYLES, type PlanningStatus } from '../constants/planning';

interface PlanningStatusBadgeProps {
  status: PlanningStatus;
}

const PlanningStatusBadge: React.FC<PlanningStatusBadgeProps> = ({ status }) => {
  const info = PLANNING_STATUS_STYLES[status] || PLANNING_STATUS_STYLES.planned;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${info.className}`}>
      {info.label}
    </span>
  );
};

export default PlanningStatusBadge;


