import React from 'react';
import { useTranslation } from 'react-i18next';

interface RegistrationSuccessProps {
  companyName: string;
  userEmail: string;
  username: string;
  onGoToLogin: () => void;
}

const RegistrationSuccess: React.FC<RegistrationSuccessProps> = ({
  companyName,
  userEmail,
  username,
  onGoToLogin,
}) => {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6 text-body">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">{t('registration.registrationComplete')}</h2>
        <p className="text-muted">
          {t('registration.companyAndUserCreatedSuccessfully', { companyName })}
        </p>
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-left">
        <p className="text-sm text-heading font-medium mb-2">{t('registration.whatsNext') || 'What\'s Next?'}</p>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900 font-semibold mb-2">
              ✓ {t('registration.invitationEmailSent') || 'Password Setup Email Sent'}
            </p>
            <p className="text-xs text-green-800 mb-2">
              {t('registration.passwordSetupInvitationSent', { email: userEmail }) || `A password setup invitation has been sent to ${userEmail}.`}
            </p>
          </div>
          <ul className="text-sm text-primary space-y-1 list-disc list-inside">
            <li>{t('registration.checkEmailInbox') || 'Check your email inbox (and spam folder) for the password setup link'}</li>
            <li>{t('registration.clickLinkToSetPassword') || 'Click the link in the email to set your password'}</li>
            <li>{t('registration.invitationLinkValid24Hours') || 'The password setup link is valid for 24 hours'}</li>
            <li>{t('registration.afterSettingPasswordLogin', { username }) || `After setting your password, you can login with your username ${username}`}</li>
            <li>{t('registration.ifNoEmailCheckSpam') || 'If you don\'t receive the email, please check your spam folder or contact support'}</li>
          </ul>
        </div>
      </div>

      <button
        onClick={onGoToLogin}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
      >
        {t('registration.goToLogin')}
      </button>
    </div>
  );
};

export default RegistrationSuccess;

