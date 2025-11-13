import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import PlanningStatusBadge from '../PlanningStatusBadge';

interface PlanningMonthViewProps {
  monthStart: Date;
  entries: PlanningStudentEntry[];
  isLoading?: boolean;
  conflictSlot?: { date_day: string; hour_start: string; hour_end: string } | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectEntry: (entry: PlanningStudentEntry) => void;
  onSelectDate: (isoDate: string) => void;
  getPeriodLabel?: (entry: PlanningStudentEntry) => string;
}

const formatDateLabel = (date: Date) =>
  date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

const formatTime = (time: string) => {
  if (!time) return time;
  return time.split(':').slice(0, 2).join(':');
};

const formatTimeRange = (start: string, end: string) => `${formatTime(start)} - ${formatTime(end)}`;

const formatTeacherName = (entry: PlanningStudentEntry) => {
  const first = entry.teacher?.first_name ?? '';
  const last = entry.teacher?.last_name ?? '';
  const full = `${first} ${last}`.trim();
  return full || `Teacher #${entry.teacher_id}`;
};

const formatSessionType = (entry: PlanningStudentEntry) =>
  entry.planningSessionType?.title || `Type #${entry.planning_session_type_id}`;

const getISODate = (date: Date) => date.toISOString().split('T')[0];

const PlanningMonthView: React.FC<PlanningMonthViewProps> = ({
  monthStart,
  entries,
  isLoading,
  conflictSlot,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectEntry,
  onSelectDate,
  getPeriodLabel,
}) => {
  const [hoveredEntryId, setHoveredEntryId] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get first day of month and number of days
  const monthDays = useMemo(() => {
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Create calendar grid (6 weeks to cover all possibilities)
    const days: Array<{
      date: Date;
      iso: string;
      label: string;
      isCurrentMonth: boolean;
      entries: PlanningStudentEntry[];
    }> = [];

    // Add days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const iso = getISODate(date);
      const dayEntries = entries
        .filter((entry) => entry.date_day === iso)
        .sort((a, b) => a.hour_start.localeCompare(b.hour_start));

      days.push({
        date,
        iso,
        label: String(date.getDate()),
        isCurrentMonth: false,
        entries: dayEntries,
      });
    }

    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = getISODate(date);
      const dayEntries = entries
        .filter((entry) => entry.date_day === iso)
        .sort((a, b) => a.hour_start.localeCompare(b.hour_start));

      days.push({
        date,
        iso,
        label: String(day),
        isCurrentMonth: true,
        entries: dayEntries,
      });
    }

    // Add days from next month to fill last week
    const totalCells = 42; // 6 weeks * 7 days
    const remainingCells = totalCells - days.length;
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      const iso = getISODate(date);
      const dayEntries = entries
        .filter((entry) => entry.date_day === iso)
        .sort((a, b) => a.hour_start.localeCompare(b.hour_start));

      days.push({
        date,
        iso,
        label: String(day),
        isCurrentMonth: false,
        entries: dayEntries,
      });
    }

    return days;
  }, [monthStart, entries]);

  const monthLabel = useMemo(() => {
    return monthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [monthStart]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = (entryId: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    if (hoveredEntryId === entryId) {
      return;
    }
    
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    
    showTimeoutRef.current = setTimeout(() => {
      setHoveredEntryId(entryId);
    }, 600);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEntryId(null);
    }, 200);
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Monthly Schedule</h2>
          <p className="text-sm text-gray-500">{monthLabel}</p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="month"
            value={`${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              onSelectDate(`${year}-${month}-01`);
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Jump to month"
          />
          <button
            type="button"
            onClick={onPrevMonth}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Loading schedule...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {monthDays.map((day, index) => {
              const isToday = getISODate(new Date()) === day.iso;
              const periodLabel = day.entries.length > 0 ? getPeriodLabel?.(day.entries[0]) : null;

              return (
                <div
                  key={`${day.iso}-${index}`}
                  className={`min-h-[120px] border border-gray-200 rounded p-1.5 ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-medium ${
                        day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      } ${isToday ? 'text-blue-600 font-bold' : ''}`}
                    >
                      {day.label}
                    </span>
                    {day.entries.length > 0 && (
                      <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                        {day.entries.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 max-h-[90px] overflow-y-auto">
                    {day.entries.slice(0, 3).map((entry) => {
                      const isConflict =
                        conflictSlot &&
                        conflictSlot.date_day === entry.date_day &&
                        conflictSlot.hour_start === entry.hour_start &&
                        conflictSlot.hour_end === entry.hour_end;
                      const isHovered = hoveredEntryId === entry.id;

                      return (
                        <div key={entry.id} className="relative">
                          <button
                            type="button"
                            onClick={() => onSelectEntry(entry)}
                            onMouseEnter={() => handleMouseEnter(entry.id)}
                            onMouseLeave={handleMouseLeave}
                            className={`w-full text-left border rounded px-1.5 py-1 bg-white shadow-sm hover:shadow-md hover:border-blue-300 hover:bg-blue-50/30 transition-all duration-200 text-xs ${
                              isConflict ? 'border-red-400 ring-1 ring-red-100' : 'border-gray-200'
                            }`}
                          >
                            <div className="font-semibold text-gray-900 truncate">
                              {formatTimeRange(entry.hour_start, entry.hour_end)}
                            </div>
                            <div className="text-gray-600 truncate">{formatSessionType(entry)}</div>
                            <div className="text-gray-500 truncate">{formatTeacherName(entry)}</div>
                          </button>

                          {/* Hover Overlay - Same as week view */}
                          {isHovered && (
                            <div
                              className="fixed inset-0 z-50 transition-opacity duration-300"
                              onMouseEnter={() => handleMouseEnter(entry.id)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <div
                                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                                onClick={() => setHoveredEntryId(null)}
                              ></div>
                              <div
                                className="absolute right-8 top-1/2 -translate-y-1/2 w-[420px] max-w-[calc(100vw-4rem)] bg-white rounded-xl shadow-2xl border border-gray-200 p-6 space-y-4 animate-in slide-in-from-right duration-300 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredEntryId(null);
                                  onSelectEntry(entry);
                                }}
                              >
                                <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      <div>
                                        <p className="text-lg font-bold text-gray-900">{formatTimeRange(entry.hour_start, entry.hour_end)}</p>
                                        <p className="text-sm text-gray-500">{entry.date_day}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <p className="text-base font-semibold text-gray-800">{getPeriodLabel?.(entry) ?? entry.period}</p>
                                      <PlanningStatusBadge status={entry.status} />
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHoveredEntryId(null);
                                        onSelectEntry(entry);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setHoveredEntryId(null);
                                      }}
                                      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                      aria-label="Close"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Session Type</p>
                                      <p className="text-base text-gray-900 font-semibold">{formatSessionType(entry)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex-shrink-0">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Teacher</p>
                                      <p className="text-base text-gray-900 font-semibold">{formatTeacherName(entry)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 text-green-600 flex-shrink-0">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                      </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Class</p>
                                      <p className="text-base text-gray-900 font-semibold">{entry.class?.title || `Class #${entry.class_id}`}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {day.entries.length > 3 && (
                      <div className="text-xs text-gray-500 text-center py-1">
                        +{day.entries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningMonthView;

