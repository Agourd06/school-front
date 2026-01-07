import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui';
import { MoreHorizontal, Pencil } from 'lucide-react';
import type { ReportDetailItem } from '../Report';

interface ReportDetailsColumnProps {
  items: ReportDetailItem[];
  onViewDetails: (studentId: number, reportId: number | undefined, detailId?: number) => void;
  onShowAllCourses: () => void;
  hasCourseData: boolean;
  selectedStudentName?: string | null;
  selectedStudentHasCourses?: boolean;
  onShowSelectedStudentCourses?: () => void;
}

const ReportDetailsColumn: React.FC<ReportDetailsColumnProps> = ({
  items,
  onViewDetails,
  onShowAllCourses,
  hasCourseData,
  selectedStudentName,
  selectedStudentHasCourses = false,
  onShowSelectedStudentCourses,
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{t('sections.reportDetails')}</h2>
          {selectedStudentName && (
            <div className="flex items-center gap-2 text-base font-medium text-blue-600">
              <span>• {selectedStudentName}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 rounded-full p-0 text-blue-600 hover:bg-blue-100"
                aria-label={t('sections.showStudentCoursesNotes')}
                onClick={onShowSelectedStudentCourses}
                disabled={!selectedStudentHasCourses || !onShowSelectedStudentCourses}
                title={
                  selectedStudentHasCourses
                    ? t('sections.showStudentCoursesNotes')
                    : t('sections.noCourseDataForStudent')
                }
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!hasCourseData}
          onClick={onShowAllCourses}
          className="shrink-0"
        >
          {t('sections.allStudentNotes')}
        </Button>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">{t('sections.noReportSummariesAvailable')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">{t('sections.student')}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t('sections.course')}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t('sections.teacher')}</th>
                  <th className="px-4 py-2 text-left font-semibold">{t('sections.note')}</th>
                  <th className="px-4 py-2 text-center font-semibold">{t('sections.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((detail) => (
                  <tr key={detail.detailId ?? `${detail.studentId}-${detail.reportId ?? 'none'}`} className="text-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-semibold">{detail.studentName}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{detail.mention || t('sections.noMention')}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{detail.courseName || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{detail.teacherName || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">{detail.note ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {detail.reportId && detail.hasDetails ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="p-2"
                          aria-label={t('sections.editReport')}
                          title={t('sections.editReport')}
                          onClick={() => onViewDetails(detail.studentId, detail.reportId, detail.detailId)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">{t('sections.noDetails')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailsColumn;


