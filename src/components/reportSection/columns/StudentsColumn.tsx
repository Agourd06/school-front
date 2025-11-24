import React, { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import type { StudentCardItem } from '../Report';
import { Button } from '../../ui';

interface StudentsColumnProps {
  students: StudentCardItem[];
  onAddReport: (studentId: number) => void;
  onCreateReport: () => void;
}

const StudentsColumn: React.FC<StudentsColumnProps> = ({ students, onAddReport, onCreateReport }) => {
  const [showAllHaveReportsMessage, setShowAllHaveReportsMessage] = useState(false);
  const allStudentsHaveReports = students.length > 0 && students.every((student) => student.hasReport);

  useEffect(() => {
    if (showAllHaveReportsMessage) {
      const timer = setTimeout(() => {
        setShowAllHaveReportsMessage(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showAllHaveReportsMessage]);

  const handleCreateReportClick = () => {
    if (allStudentsHaveReports) {
      setShowAllHaveReportsMessage(true);
    } else {
      onCreateReport();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900">Students Report</h2>
        <Button type="button" size="sm" className="inline-flex items-center gap-2" onClick={handleCreateReportClick}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add report</span>
        </Button>
      </div>
      {showAllHaveReportsMessage && allStudentsHaveReports && (
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-2 flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 mb-1">All Students Have Reports</h3>
              <p className="text-sm text-gray-600">
                Every student in this class already has a report. You can modify existing reports by clicking the edit
                icon next to each student.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {students.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Students will appear here once available.
          </div>
        ) : (
          students.map((student) => (
          <div
            key={student.studentId}
            className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {student.avatar.type === 'image' ? (
                <img
                  src={student.avatar.value}
                  alt={student.name}
                  className="h-10 w-10 rounded-full object-cover border border-white shadow"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                  {student.avatar.value}
                </div>
              )}
              <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
            </div>
            <div className="flex items-center gap-2">
              {student.hasReport && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="p-2"
                  aria-label="Edit report"
                  title="Edit report"
                  onClick={() => onAddReport(student.studentId)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default StudentsColumn;


