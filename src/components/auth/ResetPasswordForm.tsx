import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ResetPasswordFormProps {
  token: string | null;
}

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing or invalid. Please request a new reset email.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await resetPassword(token, password);
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const serverMsg = axiosError?.response?.data?.message;
      let errorMessage = 'Failed to reset password. Please try again or request a new reset link.';
      
      if (Array.isArray(serverMsg)) {
        errorMessage = serverMsg.join(', ');
      } else if (typeof serverMsg === 'string') {
        errorMessage = serverMsg;
      } else if (axiosError?.message) {
        errorMessage = axiosError.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-semibold text-heading">Invalid reset link</h2>
        <p className="text-sm text-body">
          The password reset link is missing or invalid. Please request a new link from the forgot password page.
        </p>
        <Link
          to="/auth?mode=forgot-password"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          Go to Forgot Password
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-heading">Set your new password</h2>
        <p className="mt-2 text-sm text-body">
          Enter a new password for your account and confirm it below.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-heading">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-primary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-heading">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            className="mt-1 block w-full px-3 py-2 border border-primary rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700 text-center">
              Password reset successfully! You can now sign in with your new password.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          {isSubmitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        <span>Remembered your password? </span>
        <Link to="/auth?mode=login" className="font-medium text-secondary hover:text-secondary/80">
          Sign in
        </Link>
      </div>
    </div>
  );
};

export default ResetPasswordForm;

