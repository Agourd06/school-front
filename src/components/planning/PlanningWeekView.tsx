import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import PlanningStatusBadge from '../PlanningStatusBadge';

interface PlanningWeekViewProps {
  weekStart: Date;
  entries: PlanningStudentEntry[];
  isLoading?: boolean;
  conflictSlot?: { date_day: string; hour_start: string; hour_end: string } | null;
  onPrevWeek: () => void;
  onNextWeek: () => void;
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
  // Convert "HH:mm:ss" or "HH:mm" to "HH:mm"
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

const formatSessionTypeMeta = (entry: PlanningStudentEntry) => {
  const parts: string[] = [];
  if (entry.planningSessionType?.type) parts.push(entry.planningSessionType.type);
  if (entry.planningSessionType?.coefficient !== undefined && entry.planningSessionType?.coefficient !== null) {
    parts.push(`Coef ${entry.planningSessionType.coefficient}`);
  }
  return parts.join(' • ');
};

const getISODate = (date: Date) => date.toISOString().split('T')[0];

const ENTRY_TONE_STYLES: Record<
  'today' | 'future' | 'past',
  { base: string; text: string; muted: string }
> = {
  today: {
    base: 'border-green-200 bg-green-50/70 hover:border-green-300 hover:bg-green-50',
    text: 'text-green-900',
    muted: 'text-green-700',
  },
  future: {
    base: 'border-blue-200 bg-blue-50/70 hover:border-blue-300 hover:bg-blue-50',
    text: 'text-blue-900',
    muted: 'text-blue-700',
  },
  past: {
    base: 'border-gray-200 bg-gray-50 hover:border-gray-200 hover:bg-gray-50 opacity-80',
    text: 'text-gray-500',
    muted: 'text-gray-400',
  },
};

const PlanningWeekView: React.FC<PlanningWeekViewProps> = ({
  weekStart,
  entries,
  isLoading,
  conflictSlot,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectEntry,
  onSelectDate,
  getPeriodLabel,
}) => {
  const [hoveredEntryId, setHoveredEntryId] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getEntryTone = useCallback(
    (entry: PlanningStudentEntry): 'today' | 'future' | 'past' => {
      if (!entry.date_day) return 'future';
      const now = new Date();
      const start = new Date(`${entry.date_day}T${entry.hour_start || '00:00'}`);
      const end = new Date(`${entry.date_day}T${entry.hour_end || entry.hour_start || '23:59'}`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'future';
      if (now >= start && now <= end) return 'today';
      if (now < start) return 'future';
      return 'past';
    },
    []
  );

  const days = useMemo(() => {
    const start = new Date(Date.UTC(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate()
    ));

    return Array.from({ length: 5 }).map((_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const iso = getISODate(date);
      const dayEntries = entries
        .filter((entry) => entry.date_day === iso)
        .sort((a, b) => a.hour_start.localeCompare(b.hour_start));

      return {
        date,
        iso,
        label: formatDateLabel(date),
        entries: dayEntries,
      };
    });
  }, [weekStart, entries]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 4);
    return end;
  }, [weekStart]);

  // Cleanup timeout on unmount
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
    // Clear any pending hide timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // If already showing this entry, keep it visible immediately (no delay)
    if (hoveredEntryId === entryId) {
      return;
    }
    
    // Clear any existing show timeout
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    
    // Set a delay before showing the overlay (0.6 seconds)
    showTimeoutRef.current = setTimeout(() => {
      setHoveredEntryId(entryId);
    }, 600);
  };

  const handleMouseLeave = () => {
    // Clear the show timeout if mouse leaves before delay completes
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    
    // Hide the overlay after a small delay to allow moving to overlay
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredEntryId(null);
    }, 200);
  };

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Weekly Schedule</h2>
          <p className="text-sm text-gray-500">
            {weekStart.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })} – {weekEnd.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            value={getISODate(weekStart)}
            onChange={(e) => onSelectDate(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Jump to week"
          />
          <button
            type="button"
            onClick={onPrevWeek}
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
            onClick={onNextWeek}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm p-6">
            Loading schedule...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {days.map((day) => (
              <div key={day.iso} className="p-3 min-h-[180px] overflow-x-hidden">
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">{day.label}</span>
                </div>
                {day.entries.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">No sessions</div>
                ) : (
                  <div className="space-y-2">
                    {day.entries.map((entry) => {
                      const periodLabel = getPeriodLabel?.(entry) ?? entry.period;
                      const tone = ENTRY_TONE_STYLES[getEntryTone(entry)];
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
                            className={`w-full text-left border rounded-lg px-2.5 py-2 shadow-sm transition-all duration-200 ${
                              isConflict ? 'border-red-400 ring-2 ring-red-100' : tone.base
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold whitespace-nowrap ${tone.text}`}>
                                {formatTimeRange(entry.hour_start, entry.hour_end)}
                              </span>
                            </div>
                            <p className={`text-xs line-clamp-1 leading-tight mb-0.5 ${tone.text}`}>{periodLabel}</p>
                            <p className={`text-xs line-clamp-1 leading-tight mb-0.5 ${tone.muted}`}>
                              {formatSessionType(entry)}
                            </p>
                            <p className={`text-xs line-clamp-1 leading-tight ${tone.muted}`}>
                              {formatTeacherName(entry)}
                            </p>
                          </button>

                          {/* Large Hover Overlay - Fixed Position */}
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
                                {/* Header */}
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
                                      <p className="text-base font-semibold text-gray-800">{periodLabel}</p>
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

                                {/* Details Grid */}
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
                                    {formatSessionTypeMeta(entry) && (
                                      <p className="text-xs text-gray-500 mt-0.5">{formatSessionTypeMeta(entry)}</p>
                                    )}
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

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Room</p>
                                    <p className="text-base text-gray-900 font-semibold">{entry.classRoom?.title || `Room #${entry.class_room_id}`}</p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Specialization</p>
                                    <p className="text-base text-gray-900 font-semibold">{entry.specialization?.title || `Spec #${entry.specialization_id}`}</p>
                                  </div>
                                </div>

                                {entry.created_at && (
                                  <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm text-gray-600">
                                      Created on {new Date(entry.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanningWeekView;


