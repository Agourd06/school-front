import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BaseModal from "./BaseModal";
import {
  useCreateSchoolYearPeriod,
  useUpdateSchoolYearPeriod,
  useSchoolYearPeriods,
} from "../../hooks/useSchoolYearPeriods";
import { useSchoolYears, useSchoolYear } from "../../hooks/useSchoolYears";
import type { GetAllSchoolYearsParams } from "../../api/schoolYear";
import { SchoolYearPeriodForm, type SchoolYearPeriod } from "../forms";

interface SchoolYearPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: SchoolYearPeriod | null;
  initialSchoolYearId?: number;
}

const SchoolYearPeriodModal: React.FC<SchoolYearPeriodModalProps> = ({
  isOpen,
  onClose,
  period,
  initialSchoolYearId,
}) => {
  const { t } = useTranslation();
  const params: GetAllSchoolYearsParams = useMemo(
    () => ({ limit: 100, page: 1 }),
    []
  );
  const { data: yearsData } = useSchoolYears(params);

  const schoolYearIdForFetch = period
    ? period.schoolYearId || period.schoolYear?.id || 0
    : initialSchoolYearId || 0;
  const { data: selectedSchoolYear } = useSchoolYear(schoolYearIdForFetch);

  const createMutation = useCreateSchoolYearPeriod();
  const updateMutation = useUpdateSchoolYearPeriod();
  const [serverError, setServerError] = useState<string | null>(null);
  const [ongoingWarning, setOngoingWarning] = useState<string | null>(null);

  const isSchoolYearLocked = !!period || !!initialSchoolYearId;

  // Fetch ongoing periods for validation when we have a known schoolYearId
  // When creating without a locked schoolYearId, we'll rely on API validation
  const knownSchoolYearId = period?.schoolYearId || period?.schoolYear?.id || initialSchoolYearId;
  const { data: ongoingPeriodsData } = useSchoolYearPeriods({
    schoolYearId: knownSchoolYearId,
    lifecycle_status: 'ongoing',
    limit: 100,
  });
  const knownOngoingPeriods = ongoingPeriodsData?.data ?? [];

  const handleSubmit = async (formData: {
    title: string;
    start_date: string;
    end_date: string;
    status: number;
    schoolYearId: number | '';
    lifecycle_status: 'planned' | 'ongoing' | 'completed';
  }) => {
    setServerError(null);
    setOngoingWarning(null);

    const targetSchoolYearId = Number(formData.schoolYearId);

    const payload = {
      schoolYearId: targetSchoolYearId,
      title: formData.title,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      lifecycle_status: formData.lifecycle_status,
    };

    try {
      // Check for ongoing conflicts if setting to ongoing
      // Only do client-side check if we're checking the same schoolYearId we pre-fetched
      // Otherwise, rely on API validation
      if (formData.lifecycle_status === 'ongoing') {
        if (targetSchoolYearId === knownSchoolYearId) {
          const ongoingPeriodsInSameYear = knownOngoingPeriods.filter(
            (p) => p.id !== period?.id
          );
          if (ongoingPeriodsInSameYear.length > 0) {
            setServerError(t('sections.ongoingPeriodConflict'));
            return;
          }
        }
        // If checking a different schoolYearId, API will validate
      }

      // Check if changing the only ongoing period in the school year to another status
      if (period && period.lifecycle_status === 'ongoing' && formData.lifecycle_status !== 'ongoing') {
        const currentSchoolYearId = period.schoolYearId || period.schoolYear?.id;
        if (currentSchoolYearId === knownSchoolYearId) {
          const isOnlyOngoing = knownOngoingPeriods.length === 1 && knownOngoingPeriods[0].id === period.id;
          if (isOnlyOngoing) {
            const schoolYearTitle = selectedSchoolYear?.title || t('sections.schoolYear');
            setOngoingWarning(t('sections.onlyOngoingPeriodWarning', { schoolYearTitle }));
            // Continue with submission (warning is informational, not blocking)
          }
        }
        // If different schoolYearId, API validation will handle it
      }

      if (period?.id) {
        await updateMutation.mutateAsync({ id: period.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      let errorMessage = t('sections.errorSavingPeriod');
      
      if (Array.isArray(dataMessage)) {
        errorMessage = dataMessage.join(', ');
      } else if (typeof dataMessage === 'string') {
        errorMessage = dataMessage;
      } else if (typeof axiosError.message === 'string') {
        errorMessage = axiosError.message;
      }
      
      setServerError(errorMessage);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={period ? t('sections.editPeriod') : t('sections.addPeriod')}
    >
      <SchoolYearPeriodForm
        initialData={period}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={serverError}
        ongoingWarning={ongoingWarning}
        onDismissWarning={() => setOngoingWarning(null)}
        schoolYears={(yearsData?.data || []) as Array<{
          id: number;
          title: string;
          start_date?: string;
          end_date?: string;
        }>}
        selectedSchoolYear={selectedSchoolYear || null}
        isSchoolYearLocked={isSchoolYearLocked}
        initialSchoolYearId={initialSchoolYearId}
      />
    </BaseModal>
  );
};

export default SchoolYearPeriodModal;
