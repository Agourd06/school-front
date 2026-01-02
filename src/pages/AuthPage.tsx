import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  LoginForm, 
  ForgotPasswordForm, 
  AuthLayout 
} from '../components/auth';

type AuthMode = 'login' | 'forgot-password';

interface AuthFormProps {
  onSuccess?: () => void;
  showLinks?: boolean;
}

const AUTH_CONFIG: Record<
  AuthMode, 
  { title: string; buttonLabel: string; Component: React.FC<AuthFormProps> }
> = {
  login: {
    title: 'Sign in to your account',
    buttonLabel: 'Login',
    Component: LoginForm,
  },
  'forgot-password': {
    title: 'Reset your password',
    buttonLabel: 'Reset',
    Component: ForgotPasswordForm,
  },
};

const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const {  Component } = AUTH_CONFIG[authMode];

  // Handle URL-based mode switching
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode && ['login', 'forgot-password'].includes(mode)) {
      setAuthMode(mode as AuthMode);
    }
  }, [searchParams, navigate]);

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setSearchParams({ mode });
  };

  const renderLinks = () => {
    switch (authMode) {
      case 'login':
        return (
          <div className="text-center space-y-2">
            <button
              onClick={() => handleModeChange('forgot-password')}
              className="block w-full text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </button>
          </div>
        );
      case 'forgot-password':
        return (
          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <button
              onClick={() => handleModeChange('login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto">
      

       

        {/* Form */}
        <Component
          onSuccess={() => setAuthMode('login')}
          showLinks={false}
        />

        {/* Links */}
        <div className="mt-6">{renderLinks()}</div>
      </div>
    </AuthLayout>
  );
};

export default AuthPage;