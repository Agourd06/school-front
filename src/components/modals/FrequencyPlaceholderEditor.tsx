import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { useUpdatePlanningStudent, useCreatePlanningStudent } from '../../hooks/usePlanningStudents';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import { X, Save, Calendar, Clock } from 'lucide-react';

interface FrequencyPlaceholderEditorProps {
  isOpen: boolean;
  onClose: () => void;
  placeholders: PlanningStudentEntry[];
  onSuccess?: () => void;
}

interface PlaceholderUpdate {
  date_day: string;
  hour_start: string;
  hour_end: string;
}

const FrequencyPlaceholderEditor: React.FC<FrequencyPlaceholderEditorProps> = ({
  isOpen,
  onClose,
  placeholders,
  onSuccess,
}) => {
  const [updates, setUpdates] = useState<Record<number, PlaceholderUpdate>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const updateMut = useUpdatePlanningStudent();
  const createMut = useCreatePlanningStudent();

  // Initialize updates with current placeholder values
  React.useEffect(() => {
    if (isOpen && placeholders.length > 0) {
      const initialUpdates: Record<number, PlaceholderUpdate> = {};
      placeholders.forEach((placeholder) => {
        initialUpdates[placeholder.id] = {
          date_day: placeholder.date_day || '',
          hour_start: placeholder.hour_start || '',
          hour_end: placeholder.hour_end || '',
        };
      });
      setUpdates(initialUpdates);
      setErrors({});
    }
  }, [isOpen, placeholders]);

  // Check if a placeholder is new (not yet created - has negative ID)
  const isNewPlaceholder = (id: number): boolean => {
    return id < 0;
  };

  const handleUpdate = (id: number, field: keyof PlaceholderUpdate, value: string) => {
    setUpdates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
    // Clear error for this field
    if (errors[id]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const validatePlaceholder = (id: number): boolean => {
    const update = updates[id];
    if (!update) return false;

    const newErrors: string[] = [];

    if (!update.date_day) {
      newErrors.push('Date is required');
    }

    if (!update.hour_start) {
      newErrors.push('Start time is required');
    }

    if (!update.hour_end) {
      newErrors.push('End time is required');
    }

    if (update.hour_start && update.hour_end && update.hour_start >= update.hour_end) {
      newErrors.push('End time must be after start time');
    }

    if (newErrors.length > 0) {
      setErrors((prev) => ({
        ...prev,
        [id]: newErrors.join(', '),
      }));
      return false;
    }

    return true;
  };

  const handleSavePlaceholder = async (id: number) => {
    if (!validatePlaceholder(id)) return;

    setSavingId(id);
    try {
      const update = updates[id];
      const placeholder = placeholders.find(p => p.id === id);
      
      if (!placeholder) {
        setErrors((prev) => ({
          ...prev,
          [id]: 'Placeholder not found',
        }));
        setSavingId(null);
        return;
      }

      if (isNewPlaceholder(id)) {
        // Create new planning
        await createMut.mutateAsync({
          period: placeholder.period,
          teacher_id: placeholder.teacher_id,
          class_id: placeholder.class_id,
          class_room_id: placeholder.class_room_id,
          planning_session_type_id: placeholder.planning_session_type_id,
          course_id: placeholder.course_id,
          date_day: update.date_day,
          hour_start: update.hour_start,
          hour_end: update.hour_end,
          school_year_id: placeholder.school_year_id || undefined,
          status: placeholder.status,
        });
      } else {
        // Update existing planning
        await updateMut.mutateAsync({
          id,
          data: {
            date_day: update.date_day,
            hour_start: update.hour_start,
            hour_end: update.hour_end,
          },
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: unknown) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        (isNewPlaceholder(id) ? 'Failed to create planning' : 'Failed to update planning');
      setErrors((prev) => ({
        ...prev,
        [id]: errorMessage,
      }));
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    let hasErrors = false;
    placeholders.forEach((placeholder) => {
      if (!validatePlaceholder(placeholder.id)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      return;
    }

    // Save all placeholders sequentially
    for (const placeholder of placeholders) {
      await handleSavePlaceholder(placeholder.id);
    }
    
    if (onSuccess) {
      onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {placeholders.length > 0 && placeholders.some(p => isNewPlaceholder(p.id))
              ? 'Create Frequency Placeholders'
              : 'Update Frequency Placeholders'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            {placeholders.length > 0 && placeholders.some(p => isNewPlaceholder(p.id))
              ? 'Set the date and time for each placeholder. Each placeholder should have a different date/time to represent the course sessions throughout the week. Click "Create" or "Create All" to save them.'
              : 'Update the date and time for each placeholder. Each placeholder should have a different date/time to represent the course sessions throughout the week.'}
          </p>

          {placeholders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No placeholders to update</div>
          ) : (
            <div className="space-y-4">
              {placeholders.map((placeholder, index) => {
                const update = updates[placeholder.id];
                const error = errors[placeholder.id];
                const isSaving = savingId === placeholder.id;

                return (
                  <div
                    key={placeholder.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {isNewPlaceholder(placeholder.id) 
                            ? `New Placeholder (${index + 1} of ${placeholders.length})`
                            : `Placeholder #${placeholder.id} (${index + 1} of ${placeholders.length})`
                          }
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {placeholder.course?.title || `Course #${placeholder.course_id}`} -{' '}
                          {placeholder.class?.title || `Class #${placeholder.class_id}`}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSavePlaceholder(placeholder.id)}
                        isLoading={isSaving}
                        disabled={isSaving || updateMut.isPending || createMut.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {isNewPlaceholder(placeholder.id) ? 'Create' : 'Save'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          Date
                        </label>
                        <Input
                          type="date"
                          value={update?.date_day || ''}
                          onChange={(e) => handleUpdate(placeholder.id, 'date_day', e.target.value)}
                          error={error && error.includes('Date') ? error : undefined}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={update?.hour_start || ''}
                          onChange={(e) => handleUpdate(placeholder.id, 'hour_start', e.target.value)}
                          error={error && error.includes('Start') ? error : undefined}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={update?.hour_end || ''}
                          onChange={(e) => handleUpdate(placeholder.id, 'hour_end', e.target.value)}
                          error={error && error.includes('End') ? error : undefined}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-md p-2">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={onClose} disabled={updateMut.isPending}>
              Close
            </Button>
            {placeholders.length > 0 && (
              <Button
                variant="primary"
                onClick={handleSaveAll}
                isLoading={(updateMut.isPending || createMut.isPending) && savingId === null}
                disabled={updateMut.isPending || createMut.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {placeholders.some(p => isNewPlaceholder(p.id)) ? 'Create All' : 'Save All'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrequencyPlaceholderEditor;

