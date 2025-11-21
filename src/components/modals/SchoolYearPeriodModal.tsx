import React, { useEffect, useMemo, useState } from "react";
import BaseModal from "./BaseModal";
import {
  useCreateSchoolYearPeriod,
  useUpdateSchoolYearPeriod,
} from "../../hooks/useSchoolYearPeriods";
import { useSchoolYears, useSchoolYear } from "../../hooks/useSchoolYears";
import type { GetAllSchoolYearsParams } from "../../api/schoolYear";
import {
  validateRequired,
  validateDateOrder,
  validateSelectRequired,
} from "./validations";
import { STATUS_OPTIONS_FORM } from "../../constants/status";
import { Input, Select, Button } from "../ui";

interface SchoolYearPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: any | null;
  initialSchoolYearId?: number;
}

const SchoolYearPeriodModal: React.FC<SchoolYearPeriodModalProps> = ({
  isOpen,
  onClose,
  period,
  initialSchoolYearId,
}) => {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<number>(1);
  const [schoolYearId, setSchoolYearId] = useState<number | "">("");
  const [lifecycleStatus, setLifecycleStatus] = useState<
    "planned" | "ongoing" | "completed"
  >("planned");

  const params: GetAllSchoolYearsParams = useMemo(
    () => ({ limit: 100, page: 1 }),
    []
  );
  const { data: yearsData } = useSchoolYears(params);
  
  // When editing, use the period's school year ID; when creating, use initialSchoolYearId
  const schoolYearIdForFetch = period 
    ? (period.schoolYearId || period.schoolYear?.id || 0)
    : (initialSchoolYearId || 0);
  const { data: selectedSchoolYear } = useSchoolYear(schoolYearIdForFetch);

  const createMutation = useCreateSchoolYearPeriod();
  const updateMutation = useUpdateSchoolYearPeriod();

  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatDateWithMonthDay = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Lock school year when editing (period exists) or when creating with initialSchoolYearId
  const isSchoolYearLocked = !!period || !!initialSchoolYearId;

  useEffect(() => {
    if (period) {
      setTitle(period.title || "");
      setStartDate(period.start_date || "");
      setEndDate(period.end_date || "");
      setStatus(typeof period.status === "number" ? period.status : 1);
      setSchoolYearId(period.schoolYearId || period.schoolYear?.id || "");
      setLifecycleStatus(period.lifecycle_status || "planned");
    } else {
      setTitle("");
      setStartDate("");
      setEndDate("");
      setStatus(1);
      setSchoolYearId(initialSchoolYearId ?? "");
      setLifecycleStatus("planned");
    }
  }, [period, isOpen, initialSchoolYearId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const requiredTitle = validateRequired(title, "Title");
    if (requiredTitle) newErrors.title = requiredTitle;
    const startReq = validateRequired(startDate, "Start date");
    if (startReq) newErrors.start_date = startReq;
    const endReq = validateRequired(endDate, "End date");
    if (endReq) newErrors.end_date = endReq;
    const dateOrder = validateDateOrder(startDate, endDate, {
      start: "start date",
      end: "end date",
    });
    if (!newErrors.start_date && !newErrors.end_date && dateOrder)
      newErrors.date = dateOrder;
    const yearReq = validateSelectRequired(schoolYearId, "School year");
    if (yearReq) newErrors.schoolYearId = yearReq;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const payload = {
      schoolYearId: Number(schoolYearId),
      title,
      start_date: startDate,
      end_date: endDate,
      status,
      lifecycle_status: lifecycleStatus,
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* School Year - moved to top */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            School Year
          </label>
          {isSchoolYearLocked && (selectedSchoolYear || period?.schoolYear) ? (
            <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
              <div className="text-sm font-medium text-gray-900">
                {selectedSchoolYear?.title || period?.schoolYear?.title || 'N/A'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDateWithMonthDay(selectedSchoolYear?.start_date || period?.schoolYear?.start_date || '')} -{" "}
                {formatDateWithMonthDay(selectedSchoolYear?.end_date || period?.schoolYear?.end_date || '')}
              </div>
            </div>
          ) : (
            <Select
              value={schoolYearId}
              onChange={(e) =>
                setSchoolYearId(e.target.value ? Number(e.target.value) : "")
              }
              disabled={isSchoolYearLocked}
              options={[
                { value: '', label: 'Select a school year' },
                ...((yearsData?.data || []).map((y: any) => ({
                  value: y.id,
                  label: y.title,
                })))
              ]}
              error={errors.schoolYearId}
              className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                isSchoolYearLocked ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          )}
        </div>

        <Input
          label="Title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            error={errors.start_date}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            error={errors.end_date || errors.date}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <Select
          label="Lifecycle Status"
          value={lifecycleStatus}
          onChange={(e) =>
            setLifecycleStatus(
              e.target.value as "planned" | "ongoing" | "completed"
            )
          }
          options={[
            { value: 'planned', label: 'Planned' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(Number(e.target.value))}
          options={STATUS_OPTIONS_FORM.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {period ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default SchoolYearPeriodModal;
