import React from 'react';

interface StepProgressProps {
  steps: Array<{ key: string; label: string; description?: string }>;
  currentIndex: number;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentIndex }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const stateClasses = isActive
          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
          : isCompleted
            ? 'border-green-400 bg-green-50 text-green-700 shadow-sm'
            : 'border-gray-200 bg-white text-gray-500';
        const badgeClasses = isActive
          ? 'bg-blue-600 text-white'
          : isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-200 text-gray-600';

        return (
          <div
            key={step.key}
            className={`relative rounded-2xl border px-4 py-3 transition-colors duration-200 ${stateClasses}`}
          >
            {isCompleted && (
              <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-green-500" />
            )}
            {isActive && (
              <div className="absolute inset-y-0 left-0 w-1 rounded-l-2xl bg-blue-500" />
            )}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${badgeClasses}`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.label}</p>
                {step.description && (
                  <p className="text-xs text-gray-500">{step.description}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StepProgress;

