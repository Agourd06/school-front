import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import { Link } from 'react-router-dom';

const TeacherPlanningsPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { data: plannings, isLoading } = usePlanningStudents({
    teacher_id: teacherId,
    order: 'ASC',
    limit: 100,
  });

  const sessions = plannings?.data || [];

  // Filter by date if selected
  const filteredSessions = selectedDate
    ? sessions.filter((s) => s.date_day === selectedDate)
    : sessions;

  // Group by date
  const groupedByDate = filteredSessions.reduce((acc, session) => {
    const date = session.date_day;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Schedule</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No classes scheduled.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDate)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, dateSessions]) => (
              <div key={date} className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </h3>
                <div className="space-y-3">
                  {dateSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {session.course?.title || `Course #${session.course_id}`}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {session.class?.title || `Class #${session.class_id}`} •{' '}
                          {session.classRoom?.title || `Room #${session.class_room_id}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {session.hour_start} - {session.hour_end} •{' '}
                          {session.planningSessionType?.title || 'Session'}
                        </div>
                      </div>
                      <Link
                        to={`/teacher/attendance?planning=${session.id}`}
                        className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                      >
                        Manage Session
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default TeacherPlanningsPage;

