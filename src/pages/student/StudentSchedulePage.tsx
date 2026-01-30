import React, { useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentWithClass } from '../../hooks/useStudents';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import SearchSelect, { type SearchSelectOption } from '../../components/inputs/SearchSelect';
import ScheduleWeekView from '../../components/schedule/ScheduleWeekView';
import { getMonday } from '../../components/planning/utils';

const StudentSchedulePage: React.FC = () => {
  const { user } = useAuth();
  const { data: studentByEmail } = useStudentByEmail(user?.email);
  const studentId = studentByEmail?.id;

  // Get student with their active class (includes class_id)
  const { data: studentWithClass } = useStudentWithClass(studentId || 0);
  const studentClass = studentWithClass?.class;
  
  const { data: planningData, isLoading } = usePlanningStudents({
    class_id: studentClass?.id || undefined,
    limit: 100, // API maximum limit
  });

  const allSessions = planningData?.data || [];

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  // Filters state
  const [selectedCourse, setSelectedCourse] = useState<number | string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<number | string>('');

  // Get unique courses and teachers for filters
  const { courses, teachers } = useMemo(() => {
    const uniqueCourses = new Map<number, { id: number; title: string }>();
    const uniqueTeachers = new Map<number, { id: number; name: string }>();

    allSessions.forEach((session) => {
      if (session.course?.id && session.course?.title) {
        uniqueCourses.set(session.course.id, {
          id: session.course.id,
          title: session.course.title,
        });
      }
      if (session.teacher?.id) {
        const teacherName = `${session.teacher.first_name || ''} ${session.teacher.last_name || ''}`.trim();
        if (teacherName) {
          uniqueTeachers.set(session.teacher.id, {
            id: session.teacher.id,
            name: teacherName,
          });
        }
      }
    });

    return {
      courses: Array.from(uniqueCourses.values()),
      teachers: Array.from(uniqueTeachers.values()),
    };
  }, [allSessions]);

  // Filter sessions by course and teacher
  const filteredSessions = useMemo(() => {
    return allSessions.filter((session) => {
      if (selectedCourse && session.course?.id !== selectedCourse) return false;
      if (selectedTeacher && session.teacher?.id !== selectedTeacher) return false;
      return true;
    });
  }, [allSessions, selectedCourse, selectedTeacher]);

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

  // Course options for filter
  const courseOptions: SearchSelectOption[] = [
    { value: '', label: 'All Courses' },
    ...courses.map((course) => ({
      value: course.id,
      label: course.title,
    })),
  ];

  // Teacher options for filter
  const teacherOptions: SearchSelectOption[] = [
    { value: '', label: 'All Teachers' },
    ...teachers.map((teacher) => ({
      value: teacher.id,
      label: teacher.name,
    })),
  ];

  // Clear all filters
  const clearFilters = () => {
    setSelectedCourse('');
    setSelectedTeacher('');
  };

  const hasActiveFilters = selectedCourse || selectedTeacher;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your schedule...</div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Student profile not found</div>
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

      {/* Filters Section */}
      {(selectedCourse || selectedTeacher) && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Filter */}
            <div>
              <SearchSelect
                label="Course"
                value={selectedCourse}
                onChange={(value) => setSelectedCourse(value)}
                options={courseOptions}
                placeholder="All Courses"
              />
            </div>

            {/* Teacher Filter */}
            <div>
              <SearchSelect
                label="Teacher"
                value={selectedTeacher}
                onChange={(value) => setSelectedTeacher(value)}
                options={teacherOptions}
                placeholder="All Teachers"
              />
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule View */}
      <ScheduleWeekView
        weekStart={currentWeekStart}
        entries={filteredSessions}
        isLoading={isLoading}
        onPrevWeek={() => handleWeekChange(-7)}
        onNextWeek={() => handleWeekChange(7)}
        onToday={handleToday}
        onSelectDate={handleWeekDateSelect}
      />
    </div>
  );
};

export default StudentSchedulePage;
