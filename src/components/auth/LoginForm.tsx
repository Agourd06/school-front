import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSuccess?: () => void;
  showLinks?: boolean;
}

// Module-level variable to persist error across component remounts
let persistentError: string = '';

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, showLinks = true }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(persistentError); // Initialize from persistent storage
  const { login, isLoading } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const isSubmittingRef = useRef(false);

  // Restore error from persistent storage on mount
  useEffect(() => {
    if (persistentError && !error) {
      setError(persistentError);
    }
  }, []);

  // Keep error in sync with persistent storage
  useEffect(() => {
    if (error) {
      persistentError = error;
    } else {
      persistentError = '';
    }
  }, [error]);

  // Restore error when isLoading becomes false
  useEffect(() => {
    if (!isLoading && persistentError && !error) {
      setTimeout(() => {
        if (persistentError) {
          setError(persistentError);
        }
      }, 100);
    }
  }, [isLoading, error]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || isLoading) {
      return;
    }
    
    // Clear previous errors
    setError('');
    persistentError = '';
    
    // Validate inputs before submitting
    if (!email.trim() || !password.trim()) {
      const validationError = 'Please enter both email and password';
      setError(validationError);
      persistentError = validationError;
      return;
    }
    
    isSubmittingRef.current = true;
    const errorMessage = 'Password or email are incorrect. Please try with valid credentials.';
    
    try {
      await login(email, password);
      // Only call onSuccess if login succeeds
      setError('');
      persistentError = '';
      onSuccess?.();
    } catch (err: unknown) {
      // Check if user needs to set password first
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      const backendMessage = axiosError?.response?.data?.message || '';
      
      // If backend indicates user needs to set password, show helpful message
      if (typeof backendMessage === 'string' && 
          (backendMessage.toLowerCase().includes('set your password') || 
           backendMessage.toLowerCase().includes('set password') ||
           backendMessage.toLowerCase().includes('password invitation'))) {
        const passwordSetMessage = 'Please check your email for the password invitation link to set your password first.';
        persistentError = passwordSetMessage;
        setError(passwordSetMessage);
      } else {
        // Simple, clear error message for any other login failure
        // Store error in persistent storage (survives remounts)
        persistentError = errorMessage;
        setError(errorMessage);
      }
      
      // Restore error after isLoading changes
      setTimeout(() => {
        if (persistentError && !error) {
          setError(persistentError);
        }
      }, 150);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
      </div>
      
      <form 
        ref={formRef}
        className="space-y-6" 
        onSubmit={handleSubmit} 
        noValidate
        onKeyDown={(e) => {
          // Prevent form submission on Enter key if already submitting
          if (e.key === 'Enter' && (isSubmittingRef.current || isLoading)) {
            e.preventDefault();
          }
        }}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted text-heading rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                // Don't clear error on input change - let user see the error
              }}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-border placeholder-muted text-heading rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                // Don't clear error on input change - let user see the error
              }}
            />
          </div>
        </div>

        {/* Error message - only show when there's an error */}
        {(persistentError || error) && (
          <div 
            className="w-full rounded-md border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 text-center shadow-sm" 
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{persistentError || error}</span>
            </div>
          </div>
        )}

        {showLinks && (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/auth?mode=forgot-password"
                className="font-medium text-primary hover:text-primary/80"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>

        {showLinks && (
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-primary hover:text-primary/80"
              >
                Sign up
              </Link>
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default LoginForm;
