import React from 'react';
import BaseModal from '../modals/BaseModal';
import { Button } from '../ui';
import type { StudentReportDetail } from '../../api/studentReportDetail';
import { STATUS_VALUE_LABEL } from '../../constants/status';

interface ReportDetailsViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  details: StudentReportDetail[];
  isLoading: boolean;
  onAddDetail: () => void;
  onEditDetail: (detail: StudentReportDetail) => void;
}

const formatTeacherName = (detail: StudentReportDetail) => {
  const teacher = detail.teacher;
  if (!teacher) return `Teacher #${detail.teacher_id}`;
  const first = teacher.first_name ?? '';
  const last = teacher.last_name ?? '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (teacher.email) return teacher.email;
  return `Teacher #${teacher.id ?? detail.teacher_id}`;
};

const formatCourseName = (detail: StudentReportDetail) => {
  const course = detail.course;
  if (!course) return `Course #${detail.course_id}`;
  return course.title || course.code || `Course #${course.id ?? detail.course_id}`;
};

const ReportDetailsViewerModal: React.FC<ReportDetailsViewerModalProps> = ({
  isOpen,
  onClose,
  studentName,
  details,
  isLoading,
  onAddDetail,
  onEditDetail,
}) => (
  <BaseModal isOpen={isOpen} onClose={onClose} title={`Report details • ${studentName}`} className="sm:max-w-5xl">
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          {isLoading ? 'Loading details…' : `${details.length} detail${details.length === 1 ? '' : 's'}`}
        </p>
        <Button type="button" variant="primary" size="sm" onClick={onAddDetail}>
          Add detail
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Fetching report details…
        </div>
      ) : details.length === 0 ? (
        <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 p-6 text-center text-sm text-blue-700">
          No report details have been added yet for this student. Use the button above to add the first one.
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {details.map((detail) => (
            <div
              key={detail.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 lg:flex-row lg:items-start"
            >
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                  <span>{formatCourseName(detail)}</span>
                  <span className="text-gray-300">•</span>
                  <span>{formatTeacherName(detail)}</span>
                </div>
                <p className="text-xs uppercase text-gray-500">
                  {STATUS_VALUE_LABEL[detail.status] || `Status ${detail.status}`}
                </p>
                {detail.note !== undefined && detail.note !== null && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium text-gray-600">Note:</span> {detail.note}
                  </p>
                )}
                {detail.remarks && (
                  <div className="text-sm text-gray-700 prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: detail.remarks }} />
                  </div>
                )}
                {detail.updated_at && (
                  <p className="text-xs text-gray-400">
                    Updated {new Date(detail.updated_at).toLocaleString(undefined, { dateStyle: 'medium' })}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => onEditDetail(detail)}>
                  Edit detail
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </BaseModal>
);

export default ReportDetailsViewerModal;


