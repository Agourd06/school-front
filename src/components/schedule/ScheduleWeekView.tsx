import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PlanningStudentEntry } from '../../api/planningStudent';
import { Calendar } from 'lucide-react';

interface ScheduleWeekViewProps {
  weekStart: Date;
  entries: PlanningStudentEntry[];
  isLoading?: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onSelectDate: (isoDate: string) => void;
  onEntryClick?: (entry: PlanningStudentEntry) => void;
}

const formatDateLabel = (date: Date, t: (key: string) => string) => {
  const dayOfWeek = date.getDay();
  const day = date.getDate();
  const month = date.toLocaleDateString(undefined, { month: 'short' });
  
  const weekdayKeys: Record<number, string> = {
    0: 'planning.weekdaySun',
    1: 'planning.weekdayMon',
    2: 'planning.weekdayTue',
    3: 'planning.weekdayWed',
    4: 'planning.weekdayThu',
    5: 'planning.weekdayFri',
    6: 'planning.weekdaySat',
  };
  
  const weekday = t(weekdayKeys[dayOfWeek] || 'planning.weekdayMon');
  return `${weekday} ${day} ${month}`;
};

const formatTime = (time: string) => {
  if (!time) return time;
  return time.split(':').slice(0, 2).join(':');
};

const getISODate = (date: Date) => date.toISOString().split('T')[0];

const ScheduleWeekView: React.FC<ScheduleWeekViewProps> = ({
  weekStart,
  entries,
  isLoading,
  onPrevWeek,
  onNextWeek,
  onToday,
  onSelectDate,
  onEntryClick,
}) => {
  const { t } = useTranslation();
  const [showWeekend, setShowWeekend] = useState(false);

  const getEntryTone = (entry: PlanningStudentEntry): 'today' | 'future' | 'past' => {
    if (!entry.date_day) return 'future';
    const now = new Date();
    const start = new Date(`${entry.date_day}T${entry.hour_start || '00:00'}`);
    const end = new Date(`${entry.date_day}T${entry.hour_end || entry.hour_start || '23:59'}`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'future';
    if (now >= start && now <= end) return 'today';
    if (now < start) return 'future';
    return 'past';
  };

  const days = useMemo(() => {
    const start = new Date(Date.UTC(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate()
    ));

    const dayCount = showWeekend ? 7 : 5;

    return Array.from({ length: dayCount }).map((_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const iso = getISODate(date);
      const dayEntries = entries
        .filter((entry) => entry.date_day === iso)
        .sort((a, b) => (a.hour_start || '').localeCompare(b.hour_start || ''));

      return {
        date,
        iso,
        label: formatDateLabel(date, t),
        entries: dayEntries,
      };
    });
  }, [weekStart, entries, showWeekend, t]);

  const weekEnd = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + (showWeekend ? 6 : 4));
    return end;
  }, [weekStart, showWeekend]);

  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold text-gray-900 mb-1">{t('planning.weeklySchedule')}</h2>
          <p className="text-sm text-muted">
            {weekStart.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })} – {weekEnd.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <input
              type="date"
              value={getISODate(weekStart)}
              onChange={(e) => onSelectDate(e.target.value)}
              className="pl-9 pr-2 py-1.5 text-xs border-2 border-orange-500 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-500"
              aria-label="Jump to week"
            />
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          </div>
          <button
            type="button"
            onClick={onPrevWeek}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            {t('planning.prev')}
          </button>
          <button
            type="button"
            onClick={onToday}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            {t('planning.today')}
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-200 transition-colors whitespace-nowrap"
          >
            {t('planning.next')}
          </button>
          <button
            type="button"
            onClick={() => setShowWeekend(!showWeekend)}
            className={`px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-md transition-colors whitespace-nowrap ${
              showWeekend
                ? 'bg-primary text-white border-primary hover:bg-primary/90'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={t('planning.weekend')}
          >
            {t('planning.weekend')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-muted text-sm p-6">
            {t('planning.loadingSchedule')}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:divide-y-0 md:divide-x divide-y divide-gray-200 ${showWeekend ? 'md:grid-cols-7' : 'md:grid-cols-5'}`}>
            {days.map((day) => {
              const isToday = day.iso === getISODate(new Date());
              return (
                <div key={day.iso} className="p-3 min-h-[200px] overflow-x-hidden">
                  <div className={`mb-3 pb-2 ${isToday ? 'border-b-2 border-primary' : ''}`}>
                    <span className={`text-sm font-semibold ${isToday ? 'text-primary' : 'text-gray-900'}`}>
                      {day.label}
                    </span>
                  </div>
                  {day.entries.length === 0 ? (
                    <div className="text-sm text-muted text-center py-8">{t('planning.noSessions')}</div>
                  ) : (
                    <div className="space-y-2">
                      {day.entries.map((entry) => {
                        const entryTone = getEntryTone(entry);
                        const isTodayOrFuture = entryTone === 'today' || entryTone === 'future';
                        
                        const blockBgClass = isTodayOrFuture && entryTone === 'today'
                          ? 'bg-blue-50 border-blue-200'
                          : isTodayOrFuture
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-gray-50 border-gray-200';
                        
                        const textColorClass = isTodayOrFuture && entryTone === 'today'
                          ? 'text-blue-900'
                          : isTodayOrFuture
                          ? 'text-blue-800'
                          : 'text-gray-700';
                        
                        return (
                          <div
                            key={entry.id}
                            onClick={() => onEntryClick?.(entry)}
                            className={`border rounded-lg px-2.5 py-2 shadow-sm transition-all ${blockBgClass} ${onEntryClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}`}
                          >
                            <div className={`text-xs font-semibold ${textColorClass} mb-1`}>
                              {entry.course?.title || `Course #${entry.course_id}`}
                            </div>
                            <div className="text-xs text-muted mb-1">
                              {formatTime(entry.hour_start || '')}
                              {entry.hour_end && ` - ${formatTime(entry.hour_end)}`}
                            </div>
                            {entry.classRoom && (
                              <div className="text-xs text-muted truncate">
                                {entry.classRoom.title}
                              </div>
                            )}
                            {entry.class && (
                              <div className="text-xs text-muted truncate mt-0.5">
                                {entry.class.title}
                              </div>
                            )}
                            {entry.planningSessionType && (
                              <div className="text-xs text-muted mt-1">
                                {entry.planningSessionType.title}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleWeekView;
