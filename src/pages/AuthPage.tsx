import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  LoginForm, 
  RegisterForm, 
  ForgotPasswordForm, 
  AuthLayout 
} from '../components/auth';

type AuthMode = 'login' | 'register' | 'forgot-password';

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
  register: {
    title: 'Create your account',
    buttonLabel: 'Register',
    Component: RegisterForm,
  },
  'forgot-password': {
    title: 'Reset your password',
    buttonLabel: 'Reset',
    Component: ForgotPasswordForm,
  },
};

const AuthPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const {  Component } = AUTH_CONFIG[authMode];

  // Handle URL-based mode switching
  useEffect(() => {
    const mode = searchParams.get('mode') as AuthMode;
    if (mode && ['login', 'register', 'forgot-password'].includes(mode)) {
      setAuthMode(mode);
    }
  }, [searchParams]);

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
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => handleModeChange('register')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Sign up
              </button>
            </p>
          </div>
        );
      case 'register':
        return (
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => handleModeChange('login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </button>
          </p>
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