import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import ScheduleWeekView from '../../components/schedule/ScheduleWeekView';
import { getMonday } from '../../components/planning/utils';
import type { PlanningStudentEntry } from '../../api/planningStudent';

const TeacherPlanningsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const { data: plannings, isLoading } = usePlanningStudents({
    teacher_id: teacherId,
    order: 'ASC',
    limit: 100,
  });

  const sessions = plannings?.data || [];

  // Week navigation handlers
  const handleWeekChange = useCallback((days: number) => {
    setCurrentWeekStart((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + days);
      return getMonday(newDate);
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentWeekStart(getMonday(new Date()));
  }, []);

  const handleWeekDateSelect = useCallback((isoDate: string) => {
    setCurrentWeekStart(getMonday(new Date(isoDate)));
  }, []);

  const handleEntryClick = useCallback((entry: PlanningStudentEntry) => {
    // Navigate to attendance page when clicking on a session
    window.location.href = `/teacher/attendance?planning=${entry.id}`;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Schedule</h2>
        <p className="text-gray-600">View your weekly class schedule</p>
      </div>

      {/* Weekly Schedule View */}
      <ScheduleWeekView
        weekStart={currentWeekStart}
        entries={sessions}
        isLoading={isLoading}
        onPrevWeek={() => handleWeekChange(-7)}
        onNextWeek={() => handleWeekChange(7)}
        onToday={handleToday}
        onSelectDate={handleWeekDateSelect}
        onEntryClick={handleEntryClick}
      />
    </div>
  );
};

export default TeacherPlanningsPage;

