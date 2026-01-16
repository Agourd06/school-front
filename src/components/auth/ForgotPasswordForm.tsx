import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

interface ForgotPasswordFormProps {
  showLinks?: boolean;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ showLinks = true }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    try {
      await forgotPassword(email);
      setSuccess(true);
      setEmail('');
    } catch {
      setError(t('auth.failedToSendResetEmail'));
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-extrabold text-heading">
          {t('auth.forgotYourPassword')}
        </h2>
        <p className="mt-2 text-sm text-body">
          {t('auth.enterEmailForReset')}
        </p>
      </div>
      
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-heading">
            {t('auth.emailAddress')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-primary placeholder-muted text-heading rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        {success && (
          <div className="text-green-600 text-sm text-center">
            {t('auth.passwordResetEmailSent')}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? t('auth.sending') : t('auth.sendResetEmail')}
          </button>
        </div>

        {showLinks && (
          <div className="text-center">
            <span className="text-sm text-body">
              {t('auth.rememberYourPassword')}{' '}
              <Link
                to="/auth?mode=login"
                className="font-medium text-secondary hover:text-secondary/80"
              >
                {t('auth.signIn')}
              </Link>
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
