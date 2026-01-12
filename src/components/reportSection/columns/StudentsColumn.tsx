import React, { useState, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, FileDown, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';
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
  const { t } = useTranslation();
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

  const studentsWithoutReports = students.filter((s) => !s.hasReport).length;
  const studentsWithReports = students.filter((s) => s.hasReport).length;

  return (
    <div className="space-y-4">
      {/* Header with improved button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">{t('sections.studentsReport')}</h2>
          {students.length > 0 && (
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                {studentsWithReports} {t('sections.withReport')}
              </span>
              {studentsWithoutReports > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                  {studentsWithoutReports} {t('sections.withoutReport')}
                </span>
              )}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="inline-flex items-center gap-2"
          onClick={handleCreateReportClick}
          isLoading={isCreateReportLoading}
          disabled={disableCreateReport || isCreateReportLoading}
          title={t('sections.createReportsForAllStudents')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Helpful instructions banner */}
      {studentsWithoutReports > 0 && !showAllHaveReportsMessage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs text-blue-800">
              <p className="font-medium mb-1">{t('sections.howToCreateReports')}</p>
              <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
                <li>{t('sections.step1CreateReports')}</li>
                <li>{t('sections.step2ClickStudent')}</li>
              </ol>
            </div>
          </div>
        </div>
      )}
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
              <h3 className="text-base font-semibold text-gray-900 mb-1">{t('sections.allStudentsHaveReports')}</h3>
              <p className="text-sm text-gray-600">
                {t('sections.allStudentsHaveReportsMessage')}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden">
        {students.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">{t('sections.studentsWillAppearHere')}</p>
            <p className="text-xs text-gray-500">{t('sections.selectClassToViewStudents')}</p>
          </div>
        ) : (
          students.map((student) => {
            const handleCardClick = () => {
              if (!student.hasReport) {
                // For students without reports, clicking opens the create report modal
                onAddReport(student.studentId);
                return;
              }
              onCreateDetail(student.studentId);
            };

            const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCardClick();
              }
            };

            const handleCreateReportClick = (event: React.MouseEvent) => {
              event.stopPropagation();
              onAddReport(student.studentId);
            };

            const isCreatingDetail = creatingDetailStudentId === student.studentId;
            const isSelected = selectedStudentId === student.studentId;
            
            return (
              <div
                key={student.studentId}
                className={`relative rounded-xl border-2 bg-white px-5 py-4 shadow-sm transition-all duration-200
                ${student.hasReport 
                  ? 'border-gray-200 cursor-pointer hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2' 
                  : 'border-orange-200 bg-orange-50/30 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 hover:shadow-md focus-within:ring-2 focus-within:ring-orange-500 focus-within:ring-offset-2'}
                ${isCreatingDetail ? 'opacity-70 cursor-wait' : ''}
                ${isSelected ? 'border-blue-400 bg-gradient-to-r from-blue-50 via-white to-white shadow-lg ring-2 ring-blue-300 scale-[1.02]' : ''}`}
                onClick={handleCardClick}
                onKeyDown={handleCardKeyDown}
                role="button"
                tabIndex={0}
                title={student.hasReport ? t('sections.clickToAddReportDetail') : t('sections.clickToCreateReport')}
              >
                {isSelected && (
                  <span className="absolute inset-y-3 left-3 w-1 rounded-full bg-blue-500" aria-hidden="true" />
                )}

                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {student.avatar.type === 'image' ? (
                    <img
                      src={student.avatar.value}
                      alt={student.name}
                      className={`h-12 w-12 rounded-full object-cover border-2 shadow-sm flex-shrink-0 ${
                        student.hasReport ? 'border-gray-200' : 'border-orange-200'
                      }`}
                    />
                  ) : (
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center font-semibold text-sm border-2 flex-shrink-0 ${
                      student.hasReport 
                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                        : 'bg-orange-100 text-orange-700 border-orange-200'
                    }`}>
                      {student.avatar.value}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{student.name}</p>
                    {student.hasReport && (
                      <p className="text-xs mt-0.5 truncate text-gray-500">
                        {t('sections.clickToManageDetails')}
                      </p>
                    )}
                  </div>
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
                  {!student.hasReport && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="shrink-0"
                      onClick={handleCreateReportClick}
                      title={t('sections.createReportForStudent')}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="ml-1">{t('sections.createReport')}</span>
                    </Button>
                  )}
                </div>
                
                {/* Status Badge with buttons below */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                  {student.hasReport ? (
                    <>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('sections.hasReport')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="p-2"
                          aria-label={t('sections.exportReportPdf')}
                          title={t('sections.downloadStudentReport')}
                          onClick={(event) => {
                            event.stopPropagation();
                            onExportReport(student.studentId);
                          }}
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="p-2"
                          aria-label={t('sections.editReport')}
                          title={t('sections.editReport')}
                          onClick={(event) => {
                            event.stopPropagation();
                            onAddReport(student.studentId);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      <AlertCircle className="h-3 w-3" />
                      {t('sections.noReport')}
                    </span>
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


