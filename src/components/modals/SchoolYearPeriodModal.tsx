import React, { useMemo } from "react";
import BaseModal from "./BaseModal";
import {
  useCreateSchoolYearPeriod,
  useUpdateSchoolYearPeriod,
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

  const isSchoolYearLocked = !!period || !!initialSchoolYearId;

  const handleSubmit = async (formData: {
    title: string;
    start_date: string;
    end_date: string;
    status: number;
    schoolYearId: number | '';
    lifecycle_status: 'planned' | 'ongoing' | 'completed';
  }) => {
    const payload = {
      schoolYearId: Number(formData.schoolYearId),
      title: formData.title,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      lifecycle_status: formData.lifecycle_status,
    };

    if (period?.id) {
      await updateMutation.mutateAsync({ id: period.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload as any);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={period ? "Edit Period" : "Add Period"}
    >
      <SchoolYearPeriodForm
        initialData={period}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
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
