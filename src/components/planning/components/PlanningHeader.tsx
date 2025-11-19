import React from 'react';
import type { PlanningHeaderProps, PlanningViewMode } from '../types';

const modes: Array<{ id: PlanningViewMode; label: string }> = [
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
];

const PlanningHeader: React.FC<PlanningHeaderProps> = ({ viewMode, onViewModeChange, showForm, onToggleForm }) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Class Planning</h1>
      <p className="text-sm text-gray-500">Schedule and manage sessions.</p>
    </div>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        {modes.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => onViewModeChange(mode.id)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              viewMode === mode.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={onToggleForm}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 shadow-sm ${
            showForm
              ? 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
              : 'text-white bg-blue-600 border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 hover:shadow-md'
          }`}
          aria-label={showForm ? 'Hide form to view full schedule' : 'Show form to add or edit sessions'}
          title={showForm ? 'Hide form (Ctrl+F)' : 'Show form (Ctrl+F)'}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Hide Form</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Show Form</span>
            </>
          )}
        </button>
        <span className="text-xs text-gray-400 hidden sm:inline">Press Ctrl+F to toggle</span>
      </div>
    </div>
  </div>
);

export default PlanningHeader;


