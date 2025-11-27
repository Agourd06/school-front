import React from 'react';

type Step = 'company' | 'user' | 'success';

interface RegistrationProgressProps {
  currentStep: Step;
}

const RegistrationProgress: React.FC<RegistrationProgressProps> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-center">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep === 'company' ? 'bg-primary border-primary text-primary-foreground' :
            currentStep === 'user' || currentStep === 'success' ? 'bg-success border-success text-white' :
            'bg-gray-200 border-gray-300 text-gray-500'
          }`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className={`w-24 h-1 ${currentStep === 'user' || currentStep === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
            currentStep === 'user' ? 'bg-primary border-primary text-primary-foreground' :
            currentStep === 'success' ? 'bg-success border-success text-white' :
            'bg-gray-200 border-gray-300 text-gray-500'
          }`}>
            {currentStep === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span className="text-sm font-semibold">2</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-2 text-sm">
        <span className={`font-medium ${currentStep === 'company' ? 'text-primary' : 'text-gray-500'}`}>
          Company Details
        </span>
        <span className={`font-medium ${currentStep === 'user' || currentStep === 'success' ? 'text-primary' : 'text-gray-500'}`}>
          User Account
        </span>
      </div>
    </div>
  );
};

export default RegistrationProgress;

