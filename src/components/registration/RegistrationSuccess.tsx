import React from 'react';

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

  return (
    <div className="text-center space-y-6 text-body">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">Registration Complete!</h2>
        <p className="text-muted">
          Your company <span className="font-semibold">{companyName}</span> and user account have been created successfully.
        </p>
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-left">
        <p className="text-sm text-heading font-medium mb-2">What's next?</p>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900 font-semibold mb-2">✓ Invitation Email Sent</p>
            <p className="text-xs text-green-800 mb-2">
              A password setup invitation has been sent to <span className="font-semibold">{userEmail}</span>.
            </p>
          </div>
          <ul className="text-sm text-primary space-y-1 list-disc list-inside">
            <li>Check your email inbox (and spam folder) for the invitation link</li>
            <li>Click the link in the email to set your password</li>
            <li>The invitation link is valid for 24 hours</li>
            <li>After setting your password, you can login with your username <span className="font-semibold">{username}</span></li>
            <li>If you don't receive the email, please check your spam folder or contact support</li>
          </ul>
        </div>
      </div>

      <button
        onClick={onGoToLogin}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition"
      >
        Go to Login
      </button>
    </div>
  );
};

export default RegistrationSuccess;

