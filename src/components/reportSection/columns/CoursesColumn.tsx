import React from 'react';
import type { CoursePresenceRow } from '../Report';
import type { SortKey } from '../types';
import StudentDetailsButton from '../StudentDetailsButton';

interface CoursesTableProps {
  rows: CoursePresenceRow[];
  sortConfig: { key: SortKey; direction: 'asc' | 'desc' };
  onSort: (key: SortKey) => void;
}

const renderSortIndicator = (active: boolean, direction: 'asc' | 'desc') => {
  if (!active) {
    return (
      <svg className="h-3 w-3 text-gray-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 5l4 4H6l4-4zm0 10l-4-4h8l-4 4z" />
      </svg>
    );
  }
  return direction === 'asc' ? (
    <svg className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 5l4 4H6l4-4z" />
    </svg>
  ) : (
    <svg className="h-3 w-3 text-blue-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10 15l-4-4h8l-4 4z" />
    </svg>
  );
};

const CoursesTable: React.FC<CoursesTableProps> = ({ rows, sortConfig, onSort }) => (
  <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
    {rows.length === 0 ? (
      <div className="p-6 text-center text-sm text-gray-500">No presences or notes recorded yet for this class.</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-[11px]">
          <thead className="bg-gray-50 text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              {(['student', 'teacher', 'course', 'coefficient', 'note'] as SortKey[]).map((key) => (
                <th key={key} scope="col" className="px-4 py-2 text-left font-semibold">
                  <button
                    type="button"
                    onClick={() => onSort(key)}
                    className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900"
                  >
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    {renderSortIndicator(sortConfig.key === key, sortConfig.direction)}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-2 text-left font-semibold">
                Validation
              </th>
              <th scope="col" className="px-4 py-2 text-center font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((entry) => (
              <tr key={entry.id} className={`text-gray-800 ${entry.validateReport ? 'bg-green-50' : 'bg-gray-50'}`}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    {entry.avatar.type === 'image' ? (
                      <img
                        src={entry.avatar.value}
                        alt={entry.studentName}
                        className="h-7 w-7 rounded-full object-cover border border-white shadow"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold">
                        {entry.avatar.value}
                      </div>
                    )}
                    <span className="font-medium truncate max-w-[140px]">{entry.studentName}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-gray-600 truncate max-w-[130px]">{entry.teacherName}</td>
                <td className="px-4 py-2 text-gray-600 truncate max-w-[180px]">{entry.courseName}</td>
                <td className="px-4 py-2 text-gray-600 truncate max-w-[100px]">
                  {entry.courseCoefficient !== null ? entry.courseCoefficient : '—'}
                </td>
                <td className="px-4 py-2 text-gray-600 truncate max-w-[120px]">{entry.note}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      entry.validateReport ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {entry.validateReport ? 'Validated' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <StudentDetailsButton studentId={entry.studentId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default CoursesTable;


