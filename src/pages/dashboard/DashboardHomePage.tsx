import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Default dashboard page - redirects to programs
 */
const DashboardHomePage: React.FC = () => {
  return <Navigate to="/programs" replace />;
};

export default DashboardHomePage;

