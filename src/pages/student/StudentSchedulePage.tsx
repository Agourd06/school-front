import React, { useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentWithClass } from '../../hooks/useStudents';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import { Input } from '../../components/ui';
import SearchSelect, { type SearchSelectOption } from '../../components/inputs/SearchSelect';
import type { PlanningStudentEntry } from '../../api/planningStudent';

type ViewFilter = 'all' | 'upcoming' | 'past';

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

  // Filters state
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
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

  // Filter sessions - optimized single pass filtering
  const filteredSessions = useMemo(() => {
    if (!allSessions.length) return [];
    
    const now = new Date();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    
    const toDate = dateTo ? new Date(dateTo) : null;
    if (toDate) toDate.setHours(23, 59, 59, 999);
    
    // Helper to check if session is upcoming/past
    const isSessionUpcoming = (session: PlanningStudentEntry): boolean => {
      if (!session.date_day) return false;
      const sessionDate = new Date(session.date_day);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate > now) return true;
      if (sessionDate.toDateString() !== now.toDateString()) return false;
      
      const timeStr = session.hour_end || session.hour_start;
      if (!timeStr) return false;
      
      const [hours, minutes] = timeStr.split(':').map(Number);
      const sessionTime = new Date(sessionDate);
      sessionTime.setHours(hours, minutes || 0, 0, 0);
      return sessionTime > now;
    };
    
    const isSessionPast = (session: PlanningStudentEntry): boolean => {
      if (!session.date_day) return false;
      const sessionDate = new Date(session.date_day);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate < now) return true;
      if (sessionDate.toDateString() !== now.toDateString()) return false;
      
      const timeStr = session.hour_end || session.hour_start;
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const sessionTime = new Date(sessionDate);
        sessionTime.setHours(hours, minutes || 0, 0, 0);
        return sessionTime <= now;
      }
      return true;
    };
    
    // Single pass filter with all conditions
    return allSessions.filter((session) => {
      // View filter
      if (viewFilter === 'upcoming' && !isSessionUpcoming(session)) return false;
      if (viewFilter === 'past' && !isSessionPast(session)) return false;
      
      // Date range filters
      if (session.date_day) {
        const sessionDate = new Date(session.date_day);
        sessionDate.setHours(0, 0, 0, 0);
        if (fromDate && sessionDate < fromDate) return false;
        if (toDate && sessionDate > toDate) return false;
      } else if (fromDate || toDate) {
        return false;
      }
      
      // Course and teacher filters
      if (selectedCourse && session.course?.id !== selectedCourse) return false;
      if (selectedTeacher && session.teacher?.id !== selectedTeacher) return false;
      
      return true;
    });
  }, [allSessions, viewFilter, dateFrom, dateTo, selectedCourse, selectedTeacher]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, PlanningStudentEntry[]> = {};
    filteredSessions.forEach((session) => {
      if (session.date_day) {
        const dateKey = new Date(session.date_day).toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(session);
      }
    });
    return grouped;
  }, [filteredSessions]);

  const sortedDates = Object.keys(sessionsByDate).sort();

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
    setViewFilter('all');
    setDateFrom('');
    setDateTo('');
    setSelectedCourse('');
    setSelectedTeacher('');
  };

  const hasActiveFilters = viewFilter !== 'all' || dateFrom || dateTo || selectedCourse || selectedTeacher;

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
        <p className="text-gray-600">View and filter your class sessions</p>
      </div>

      {/* Filters Section */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* View Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
            <div className="flex gap-2">
              {(['all', 'upcoming', 'past'] as ViewFilter[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewFilter(view)}
                  className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    viewFilter === view
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {view === 'all' ? 'All' : view === 'upcoming' ? 'Upcoming' : 'Past'}
                </button>
              ))}
            </div>
          </div>

          {/* Date From */}
          <div>
            <Input
              label="From Date"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div>
            <Input
              label="To Date"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              min={dateFrom || undefined}
            />
          </div>

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

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredSessions.length}</span> session
            {filteredSessions.length !== 1 ? 's' : ''}
            {allSessions.length !== filteredSessions.length && (
              <span className="text-gray-500"> of {allSessions.length} total</span>
            )}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      {sortedDates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-gray-500 mb-2 text-lg font-medium">No sessions found</div>
          <p className="text-sm text-gray-400">
            {hasActiveFilters
              ? 'Try adjusting your filters to see more results.'
              : 'Your schedule will appear here once sessions are assigned.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((dateKey) => {
            const date = new Date(dateKey);
            const daySessions = sessionsByDate[dateKey];
            const isToday = dateKey === new Date().toISOString().split('T')[0];
            const isPast = date < new Date();
            
            return (
              <div
                key={dateKey}
                className={`border rounded-xl overflow-hidden transition-shadow ${
                  isToday
                    ? 'border-primary shadow-lg ring-2 ring-primary/20'
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Date Header */}
                <div
                  className={`px-4 py-3 ${
                    isToday
                      ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                      : isPast
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-lg">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      {isToday && (
                        <div className="text-sm text-white/90 mt-1">Today</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm opacity-90">
                        {daySessions.length} session{daySessions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sessions List */}
                <div className="divide-y divide-gray-100">
                  {daySessions
                    .sort((a, b) => {
                      // Sort by time
                      const timeA = a.hour_start || '';
                      const timeB = b.hour_start || '';
                      return timeA.localeCompare(timeB);
                    })
                    .map((session) => {
                      // Check if session is past by comparing date AND time
                      let isSessionPast = false;
                      if (session.date_day) {
                        const sessionDate = new Date(session.date_day);
                        const now = new Date();
                        
                        // If different day, compare dates
                        if (sessionDate.toDateString() !== now.toDateString()) {
                          isSessionPast = sessionDate < now;
                        } else {
                          // Same day - check time
                          if (session.hour_end) {
                            const [hours, minutes] = session.hour_end.split(':').map(Number);
                            const sessionEndTime = new Date(sessionDate);
                            sessionEndTime.setHours(hours, minutes || 0, 0, 0);
                            isSessionPast = sessionEndTime <= now;
                          } else if (session.hour_start) {
                            const [hours, minutes] = session.hour_start.split(':').map(Number);
                            const sessionStartTime = new Date(sessionDate);
                            sessionStartTime.setHours(hours, minutes || 0, 0, 0);
                            isSessionPast = sessionStartTime <= now;
                          } else {
                            // No time info - consider past if it's today
                            isSessionPast = true;
                          }
                        }
                      }
                      
                      return (
                        <div
                          key={session.id}
                          className="p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {/* Course Title */}
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {session.course?.title || 'Course'}
                                </h4>
                                {session.planningSessionType && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                                    {session.planningSessionType.title}
                                  </span>
                                )}
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                {/* Time */}
                                {session.hour_start && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                      />
                                    </svg>
                                    <span className="font-medium">
                                      {session.hour_start}
                                      {session.hour_end && ` - ${session.hour_end}`}
                                    </span>
                                  </div>
                                )}

                                {/* Teacher */}
                                {session.teacher && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    <span>
                                      {session.teacher.first_name} {session.teacher.last_name}
                                    </span>
                                  </div>
                                )}

                                {/* Classroom */}
                                {session.classRoom && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                      />
                                    </svg>
                                    <span>{session.classRoom.title}</span>
                                  </div>
                                )}

                                {/* Period */}
                                {session.period && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <svg
                                      className="w-4 h-4 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                      />
                                    </svg>
                                    <span>Period: {session.period}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Status Badge */}
                            <div className="flex-shrink-0">
                              <div
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  isSessionPast
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {isSessionPast ? 'Past' : 'Upcoming'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentSchedulePage;
