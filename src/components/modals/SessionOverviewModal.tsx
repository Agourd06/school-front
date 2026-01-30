import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, User, Building2, BookOpen, Layers } from 'lucide-react';
import BaseModal from './BaseModal';
import { formatPlanningDetail } from '../../utils/formatPlanningDetail';
import type { PlanningStudentEntry } from '../../api/planningStudent';

export interface SessionOverviewModalProps {
  planning: PlanningStudentEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal that displays session overview (date, time, teacher, classroom, class, period, coefficient).
 * Used from attendance / planning presence when user clicks the info icon on a planning session.
 */
const SessionOverviewModal: React.FC<SessionOverviewModalProps> = ({
  planning,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const detail = useMemo(
    () => formatPlanningDetail(planning ?? undefined, t),
    [planning, t]
  );
  const coefficient = useMemo(() => {
    if (!planning?.course) return t('forms.notSpecified');
    const course = planning.course as { coefficient?: number | string };
    return course.coefficient ?? t('forms.notSpecified');
  }, [planning, t]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen
      onClose={onClose}
      title={t('forms.sessionOverview')}
      className="sm:max-w-md"
    >
      {detail ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('common.date')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.date}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('common.time')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.time}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Layers className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('planning.sessionType')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.sessionType}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('sections.teacher')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.teacher}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Building2 className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('forms.classroom')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.classroom}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">{t('sidebar.classes')}</p>
              <p className="text-sm font-medium text-gray-900">{detail.classTitle}</p>
              <p className="text-xs text-gray-500 mt-1">{t('sections.period')}: {detail.period}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-1">{t('sections.coefficient')}</p>
            <p className="text-2xl font-semibold text-primary">{coefficient}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">{t('messages.unexpectedError')}</p>
      )}
    </BaseModal>
  );
};

export default SessionOverviewModal;
