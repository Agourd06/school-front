import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input } from '../ui';
import { useDuplicatePlanningStudent, usePlanningStudents } from '../../hooks/usePlanningStudents';
import { useClassCourses } from '../../hooks/useClassCourses';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import { X, Copy, Calendar, Repeat, AlertTriangle } from 'lucide-react';

interface PlanningDuplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  planning: PlanningStudentEntry;
  onSuccess?: (createdCount: number, plannings?: PlanningStudentEntry[], type?: 'week' | 'frequency' | 'recurring', skippedCount?: number) => void;
  onOpenPlaceholderEditor?: (placeholders: PlanningStudentEntry[]) => void;
}

type DuplicationType = 'week' | 'frequency' | 'recurring' | '';

const PlanningDuplicationModal: React.FC<PlanningDuplicationModalProps> = ({
  isOpen,
  onClose,
  planning,
  onSuccess,
  onOpenPlaceholderEditor,
}) => {
  const [duplicationType, setDuplicationType] = useState<DuplicationType>('');
  const [numberOfWeeks, setNumberOfWeeks] = useState<number>(1);
  const [durationMonths, setDurationMonths] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);

  const duplicateMut = useDuplicatePlanningStudent();

  // Fetch class course to check allday and weeklyFrequency
  const { data: classCoursesResp, isLoading: loadingClassCourse } = useClassCourses({
    class_id: planning.class_id,
    course_id: planning.course_id,
    teacher_id: planning.teacher_id,
    limit: 1,
  });

  const classCourse = classCoursesResp?.data?.[0];

  // Fetch existing plannings to check for potential conflicts
  const { data: existingPlanningsResp } = usePlanningStudents({
    teacher_id: planning.teacher_id,
    class_room_id: planning.class_room_id,
    limit: 1000, // Get all to check overlaps
  });

  const existingPlannings = useMemo(() => existingPlanningsResp?.data || [], [existingPlanningsResp]);

  // Check for potential conflicts based on duplication type
  const checkPotentialConflicts = useMemo(() => {
    if (!duplicationType || !planning.date_day || !planning.hour_start || !planning.hour_end) {
      return { count: 0, conflicts: [] };
    }

    const conflicts: PlanningStudentEntry[] = [];
    const sourceDate = new Date(planning.date_day);
    const sourceTimeStart = planning.hour_start;
    const sourceTimeEnd = planning.hour_end;

    if (duplicationType === 'week' && numberOfWeeks) {
      // Check for conflicts in the week duplication (Mon-Sat for X weeks)
      for (let week = 0; week < numberOfWeeks; week++) {
        for (let day = 0; day < 6; day++) { // Mon-Sat (6 days, skip Sunday)
          const checkDate = new Date(sourceDate);
          // Get Monday of the source week
          const monday = new Date(sourceDate);
          const dayOfWeek = monday.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others to 0-5
          monday.setDate(sourceDate.getDate() - diff);
          
          // Calculate the date for this week and day
          checkDate.setTime(monday.getTime());
          checkDate.setDate(monday.getDate() + (week * 7) + day);
          const dateStr = checkDate.toISOString().split('T')[0];

          const conflict = existingPlannings.find(
            (p) =>
              p.id !== planning.id &&
              p.date_day === dateStr &&
              p.hour_start === sourceTimeStart &&
              p.hour_end === sourceTimeEnd &&
              p.teacher_id === planning.teacher_id &&
              p.class_room_id === planning.class_room_id
          );

          if (conflict && !conflicts.find(c => c.id === conflict.id)) {
            conflicts.push(conflict);
          }
        }
      }
    } else if (duplicationType === 'recurring' && durationMonths) {
      // Check for conflicts in recurring duplication (same day of week)
      const weeksToCheck = Math.ceil(durationMonths * 4.33); // Approximate weeks

      for (let week = 0; week < weeksToCheck; week++) {
        const checkDate = new Date(sourceDate);
        checkDate.setDate(sourceDate.getDate() + (week * 7));
        const dateStr = checkDate.toISOString().split('T')[0];

        const conflict = existingPlannings.find(
          (p) =>
            p.id !== planning.id &&
            p.date_day === dateStr &&
            p.hour_start === sourceTimeStart &&
            p.hour_end === sourceTimeEnd &&
            p.teacher_id === planning.teacher_id &&
            p.class_room_id === planning.class_room_id
        );

        if (conflict && !conflicts.find(c => c.id === conflict.id)) {
          conflicts.push(conflict);
        }
      }
    } else if (duplicationType === 'frequency') {
      // For frequency, check if the source date/time already has a conflict
      const conflict = existingPlannings.find(
        (p) =>
          p.id !== planning.id &&
          p.date_day === planning.date_day &&
          p.hour_start === sourceTimeStart &&
          p.hour_end === sourceTimeEnd &&
          p.teacher_id === planning.teacher_id &&
          p.class_room_id === planning.class_room_id
      );

      if (conflict) {
        conflicts.push(conflict);
      }
    }

    // Remove duplicates
    const uniqueConflicts = Array.from(new Map(conflicts.map(c => [c.id, c])).values());

    return { count: uniqueConflicts.length, conflicts: uniqueConflicts };
  }, [duplicationType, numberOfWeeks, durationMonths, planning, existingPlannings]);

  useEffect(() => {
    if (!isOpen) {
      setDuplicationType('');
      setNumberOfWeeks(1);
      setDurationMonths(3);
      setError(null);
    }
  }, [isOpen]);

  const handleDuplicate = async () => {
    if (!duplicationType) {
      setError('Please select a duplication type');
      return;
    }

    setError(null);

    // For frequency type, generate placeholder templates locally and open editor
    if (duplicationType === 'frequency') {
      const frequencyCount = classCourse?.weeklyFrequency || 1;
      // Generate placeholder templates (not yet created)
      const placeholderTemplates: Partial<PlanningStudentEntry>[] = [];
      for (let i = 0; i < frequencyCount; i++) {
        placeholderTemplates.push({
          id: -i - 1, // Negative IDs to indicate they're not created yet
          period: planning.period,
          date_day: planning.date_day,
          hour_start: planning.hour_start,
          hour_end: planning.hour_end,
          status: planning.status,
          teacher_id: planning.teacher_id,
          specialization_id: planning.specialization_id,
          class_id: planning.class_id,
          class_room_id: planning.class_room_id,
          planning_session_type_id: planning.planning_session_type_id,
          course_id: planning.course_id,
          school_year_id: planning.school_year_id,
          teacher: planning.teacher,
          specialization: planning.specialization,
          class: planning.class,
          classRoom: planning.classRoom,
          course: planning.course,
        });
      }
      
      if (onOpenPlaceholderEditor) {
        onOpenPlaceholderEditor(placeholderTemplates as PlanningStudentEntry[]);
        onClose();
        return;
      }
    }

    // For week and recurring types, use the duplicate API
    const payload: {
      source_planning_id: number;
      type: 'week' | 'frequency' | 'recurring';
      number_of_weeks?: number;
      duration_months?: number;
    } = {
      source_planning_id: planning.id,
      type: duplicationType as 'week' | 'frequency' | 'recurring',
    };

    if (duplicationType === 'week') {
      if (numberOfWeeks < 1 || numberOfWeeks > 52) {
        setError('Number of weeks must be between 1 and 52');
        return;
      }
      payload.number_of_weeks = numberOfWeeks;
    } else if (duplicationType === 'recurring') {
      if (durationMonths < 1 || durationMonths > 24) {
        setError('Duration must be between 1 and 24 months');
        return;
      }
      payload.duration_months = durationMonths;
    }

    try {
      const result = await duplicateMut.mutateAsync(payload);
      
      if (onSuccess) {
        onSuccess(
          result.created_count, 
          result.plannings, 
          duplicationType as 'week' | 'frequency' | 'recurring',
          result.skipped_count || 0
        );
      }
      onClose();
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Failed to duplicate planning';
      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  const weekCount = numberOfWeeks * 6;
  const frequencyCount = classCourse?.weeklyFrequency || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Duplicate Planning
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Planning Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-1">Source Planning</p>
            <p className="text-sm text-blue-700">
              {planning.course?.title || `Course #${planning.course_id}`} -{' '}
              {planning.class?.title || `Class #${planning.class_id}`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {planning.date_day} • {planning.hour_start} - {planning.hour_end}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Teacher: {planning.teacher?.first_name} {planning.teacher?.last_name} • Room: {planning.classRoom?.title}
            </p>
          </div>

          {/* Overlap Warning */}
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-900 mb-1">Overlap Detection</p>
                <p className="text-xs text-yellow-800">
                  The system will automatically skip any plannings that would conflict with existing ones (same classroom, time, and teacher). 
                  You'll see how many were created and how many were skipped after duplication.
                </p>
              </div>
            </div>
          </div>

          {loadingClassCourse ? (
            <div className="text-center py-8 text-gray-500">Loading course information...</div>
          ) : (
            <>
              {/* Week Duplication (only if allday) */}
              {classCourse?.allday && (
                <div className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="duplicationType"
                      value="week"
                      checked={duplicationType === 'week'}
                      onChange={(e) => setDuplicationType(e.target.value as DuplicationType)}
                      className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="font-medium text-gray-900">Duplicate for entire week (Mon-Sat)</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Creates plannings for Monday through Saturday for the specified number of weeks.
                      </p>
                      {duplicationType === 'week' && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Number of weeks
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={52}
                              value={numberOfWeeks}
                              onChange={(e) => setNumberOfWeeks(parseInt(e.target.value) || 1)}
                              className="w-32"
                            />
                          </div>
                          <div className="bg-primary-transparent rounded-md p-3 border border-primary-light">
                            <p className="text-sm font-medium text-primary-dark">
                              Will create: <span className="font-bold">{weekCount} planning(s)</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              ({numberOfWeeks} week{numberOfWeeks !== 1 ? 's' : ''} × 6 days)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Frequency-Based Duplication */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicationType"
                    value="frequency"
                    checked={duplicationType === 'frequency'}
                    onChange={(e) => setDuplicationType(e.target.value as DuplicationType)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Copy className="h-4 w-4 text-primary" />
                      <span className="font-medium text-gray-900">
                        Create {frequencyCount} placeholder(s) based on frequency
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Creates {frequencyCount} placeholder planning(s) with the same date and time. You'll need to
                      update the date and time for each placeholder after creation.
                    </p>
                    {duplicationType === 'frequency' && (
                      <div className="mt-3 bg-yellow-50 rounded-md p-3 border border-yellow-200">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> After creation, you'll be able to edit each placeholder's date and time
                          individually.
                        </p>
                      </div>
                    )}
                  </div>
                </label>
              </div>

              {/* Recurring Duplication */}
              <div className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="duplicationType"
                    value="recurring"
                    checked={duplicationType === 'recurring'}
                    onChange={(e) => setDuplicationType(e.target.value as DuplicationType)}
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Repeat className="h-4 w-4 text-primary" />
                      <span className="font-medium text-gray-900">Repeat weekly for X months</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Creates plannings for the same day of the week and time for the specified duration.
                    </p>
                    {duplicationType === 'recurring' && (
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (months)
                          </label>
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            value={durationMonths}
                            onChange={(e) => setDurationMonths(parseInt(e.target.value) || 1)}
                            className="w-32"
                          />
                        </div>
                        <div className="bg-primary-transparent rounded-md p-3 border border-primary-light">
                          <p className="text-sm font-medium text-primary-dark">
                            Will create: <span className="font-bold">~{Math.round(durationMonths * 4.33)} planning(s)</span>
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            (Approximately {durationMonths} month{durationMonths !== 1 ? 's' : ''} × 4.33 weeks/month)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </>
          )}

          {/* Conflict Warning */}
          {duplicationType && checkPotentialConflicts.count > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-900 mb-1">
                    ⚠️ {checkPotentialConflicts.count} Potential Conflict(s) Detected
                  </p>
                  <p className="text-xs text-orange-800 mb-2">
                    {checkPotentialConflicts.count} existing planning(s) have the same classroom ({planning.classRoom?.title}), 
                    time ({planning.hour_start}-{planning.hour_end}), and teacher. 
                    The backend will automatically skip these conflicts, but you may want to adjust the duplication parameters.
                  </p>
                  {checkPotentialConflicts.conflicts.length > 0 && checkPotentialConflicts.conflicts.length <= 5 && (
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-orange-900">Conflicting plannings:</p>
                      {checkPotentialConflicts.conflicts.slice(0, 5).map((conflict) => (
                        <p key={conflict.id} className="text-xs text-orange-700 pl-2">
                          • {conflict.date_day} {conflict.hour_start}-{conflict.hour_end} - {conflict.class?.title || `Class #${conflict.class_id}`}
                        </p>
                      ))}
                      {checkPotentialConflicts.conflicts.length > 5 && (
                        <p className="text-xs text-orange-600 pl-2">
                          ... and {checkPotentialConflicts.conflicts.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} disabled={duplicateMut.isPending}>
              Cancel
            </Button>
            {duplicationType === 'frequency' ? (
              <Button
                variant="primary"
                onClick={handleDuplicate}
                isLoading={duplicateMut.isPending}
                disabled={!duplicationType || duplicateMut.isPending}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                Create & Update Placeholders
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleDuplicate}
                isLoading={duplicateMut.isPending}
                disabled={!duplicationType || duplicateMut.isPending}
              >
                Duplicate
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanningDuplicationModal;

