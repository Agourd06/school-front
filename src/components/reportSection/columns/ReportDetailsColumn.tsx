import React from 'react';
import { Button } from '../../ui';
import { Plus, Pencil } from 'lucide-react';
import type { ReportDetailItem } from '../Report';

interface ReportDetailsColumnProps {
  items: ReportDetailItem[];
  onViewDetails: (studentId: number, reportId: number | undefined, studentName: string) => void;
}

const ReportDetailsColumn: React.FC<ReportDetailsColumnProps> = ({ items, onViewDetails }) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
      {items.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-500">No report summaries available yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Student</th>
                <th className="px-4 py-2 text-left font-semibold">Course</th>
                <th className="px-4 py-2 text-left font-semibold">Teacher</th>
                <th className="px-4 py-2 text-left font-semibold">Note</th>
                <th className="px-4 py-2 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((detail) => (
                <tr key={detail.detailId ?? `${detail.studentId}-${detail.reportId ?? 'none'}`} className="text-gray-800">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{detail.studentName}</div>
                    <p className="text-xs text-gray-500 mt-0.5">{detail.mention || 'No mention'}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{detail.courseName || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{detail.teacherName || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{detail.note ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <Button
                      type="button"
                      variant={detail.hasDetails ? 'secondary' : 'primary'}
                      size="sm"
                      className="p-2"
                      disabled={!detail.reportId}
                      aria-label={
                        detail.reportId
                          ? detail.hasDetails
                            ? 'Edit report details'
                            : 'Add report details'
                          : 'Create report first'
                      }
                      title={
                        detail.reportId
                          ? detail.hasDetails
                            ? 'Edit report details'
                            : 'Add report details'
                          : 'Create report first'
                      }
                      onClick={() => onViewDetails(detail.studentId, detail.reportId, detail.studentName)}
                    >
                      {detail.reportId ? (
                        detail.hasDetails ? (
                          <Pencil className="h-4 w-4" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
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

export default ReportDetailsColumn;


