import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegistrationPage from './pages/RegistrationPage';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-xl font-bold text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Routes>
        {/* Public routes without Navbar */}
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" /> : <><Navbar /><div className="pt-16"><AuthPage /></div></>} 
        />
        <Route 
          path="/login" 
          element={<Navigate to="/auth?mode=login" />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/dashboard" /> : <RegistrationPage />} 
        />
        <Route 
          path="/signup" 
          element={<Navigate to="/register" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<Navigate to="/auth?mode=forgot-password" />} 
        />
        <Route 
          path="/reset-password" 
          element={user ? <Navigate to="/dashboard" /> : <><Navbar /><div className="pt-16"><ResetPasswordPage /></div></>} 
        />
        {/* Protected routes with Navbar */}
        <Route 
          path="/dashboard" 
          element={user ? <><Navbar /><div className="pt-16"><Dashboard /></div></> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} />} 
        />
        {/* Catch-all route for undefined paths */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/auth"} />} 
        />
      </Routes>
      
      
    </div>
  );
};

export default App;
