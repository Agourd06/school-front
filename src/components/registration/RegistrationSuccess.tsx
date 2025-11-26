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
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
        <p className="text-gray-600">
          Your company <span className="font-semibold">{companyName}</span> and user account have been created successfully.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
        <p className="text-sm text-blue-900 font-medium mb-2">What's next?</p>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-900 font-semibold mb-2">✓ Email Sent</p>
            <p className="text-xs text-green-800 mb-2">
              A password has been automatically generated and sent to <span className="font-semibold">{userEmail}</span>.
            </p>
          </div>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Check your email inbox (and spam folder) for the login credentials</li>
            <li>Use your username <span className="font-semibold">{username}</span> and the password from the email to sign in</li>
            <li>We recommend changing your password after first login</li>
            <li>If you don't receive the email, please check your spam folder or contact support</li>
          </ul>
        </div>
      </div>

      <button
        onClick={onGoToLogin}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition"
      >
        Go to Login
      </button>
    </div>
  );
};

export default RegistrationSuccess;

