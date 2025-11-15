import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';

const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-bold text-blue-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" /> : <AuthPage />} 
        />
        <Route 
          path="/login" 
          element={<Navigate to="/auth?mode=login" />} 
        />
        <Route 
          path="/register" 
          element={<Navigate to="/auth?mode=register" />} 
        />
        <Route 
          path="/forgot-password" 
          element={<Navigate to="/auth?mode=forgot-password" />} 
        />
        <Route 
          path="/reset-password" 
          element={user ? <Navigate to="/dashboard" /> : <ResetPasswordPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/auth" />} 
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
      
      
    </div>
  );
};

export default App;
