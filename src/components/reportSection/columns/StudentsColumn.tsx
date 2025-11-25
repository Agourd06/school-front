import React, { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus, Pencil, FileDown } from 'lucide-react';
import type { StudentCardItem } from '../Report';
import { Button } from '../../ui';

interface StudentsColumnProps {
  students: StudentCardItem[];
  onAddReport: (studentId: number) => void;
  onCreateReport: () => void;
  onCreateDetail: (studentId: number) => void;
  onExportReport: (studentId: number) => void;
  isCreateReportLoading?: boolean;
  disableCreateReport?: boolean;
  creatingDetailStudentId?: number | null;
  selectedStudentId?: number | null;
}

const StudentsColumn: React.FC<StudentsColumnProps> = ({
  students,
  onAddReport,
  onCreateReport,
  onCreateDetail,
  onExportReport,
  isCreateReportLoading = false,
  disableCreateReport = false,
  creatingDetailStudentId = null,
  selectedStudentId = null,
}) => {
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
    if (disableCreateReport) return;
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
        <Button
          type="button"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={handleCreateReportClick}
          isLoading={isCreateReportLoading}
          disabled={disableCreateReport || isCreateReportLoading}
        >
          <Plus className="h-4 w-4" />
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
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden">
        {students.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Students will appear here once available.
          </div>
        ) : (
          students.map((student) => {
            const handleCardClick = () => {
              if (!student.hasReport) return;
              onCreateDetail(student.studentId);
            };

            const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
              if (!student.hasReport) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onCreateDetail(student.studentId);
              }
            };

            const isCreatingDetail = creatingDetailStudentId === student.studentId;
            const isSelected = selectedStudentId === student.studentId;
            return (
              <div
                key={student.studentId}
                className={`relative rounded-xl border bg-white px-5 py-3 shadow-sm flex items-center justify-between gap-3 transition
                ${student.hasReport ? 'border-gray-200 cursor-pointer hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500' : 'border-gray-100 opacity-70 cursor-not-allowed'}
                ${isCreatingDetail ? 'opacity-70 cursor-wait' : ''}
                ${isSelected ? 'border-transparent bg-gradient-to-r from-blue-50 via-white to-white shadow-lg ring-2 ring-blue-200 scale-[1.01]' : ''}`}
                onClick={handleCardClick}
                onKeyDown={handleCardKeyDown}
                role={student.hasReport ? 'button' : undefined}
                tabIndex={student.hasReport ? 0 : -1}
                aria-disabled={!student.hasReport}
                title={student.hasReport ? 'Click to add report detail' : 'Create a report first'}
              >
                {isSelected && (
                  <span className="absolute inset-y-2 left-2 w-1 rounded-full bg-blue-500" aria-hidden="true" />
                )}
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
                  {isCreatingDetail && (
                    <svg
                      className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {student.hasReport && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="p-2"
                      aria-label="Export report PDF"
                      title="Download student report"
                      onClick={(event) => {
                        event.stopPropagation();
                        onExportReport(student.studentId);
                      }}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                  )}
                  {student.hasReport && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="p-2"
                      aria-label="Edit report"
                      title="Edit report"
                      onClick={(event) => {
                        event.stopPropagation();
                        onAddReport(student.studentId);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentsColumn;


