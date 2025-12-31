import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentPresences } from '../../hooks/useStudentPresence';

const StudentAttendancePage: React.FC = () => {
  const { user } = useAuth();
  const { data: studentByEmail, isLoading: loadingStudent } = useStudentByEmail(user?.email);
  const studentId = studentByEmail?.id;

  const { data: presenceData, isLoading: loadingPresence } = useStudentPresences({
    student_id: studentId,
    limit: 100, // API maximum limit
  });

  const presences = presenceData?.data || [];

  // Calculate statistics - MUST be called before any early returns
  const stats = useMemo(() => {
    const total = presences.length;
    const present = presences.filter((p) => p.presence === 'present').length;
    const absent = presences.filter((p) => p.presence === 'absent').length;
    const late = presences.filter((p) => p.presence === 'late').length;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return { total, present, absent, late, attendanceRate };
  }, [presences]);

  // Group by month - MUST be called before any early returns
  const presencesByMonth = useMemo(() => {
    const grouped: Record<string, typeof presences> = {};
    presences.forEach((presence) => {
      if (presence.studentPlanning?.date_day) {
        const date = new Date(presence.studentPlanning.date_day);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(presence);
      }
    });
    return grouped;
  }, [presences]);

  const sortedMonths = Object.keys(presencesByMonth).sort().reverse();

  // Early returns AFTER all hooks
  if (loadingStudent || loadingPresence) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your attendance...</div>
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Attendance</h2>
        <p className="text-gray-600">Track your attendance and presence records</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600 mt-1">Total Sessions</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-gray-600 mt-1">Present</div>
        </div>
        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
          <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
          <div className="text-sm text-gray-600 mt-1">Absent</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <div className="text-2xl font-bold text-purple-600">{stats.attendanceRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">Attendance Rate</div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      {sortedMonths.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">No attendance records yet</div>
          <p className="text-sm text-gray-400">Your attendance will appear here once records are created.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedMonths.map((monthKey) => {
            const monthPresences = presencesByMonth[monthKey];
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            });

            return (
              <div key={monthKey} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
                  <div className="font-semibold">{monthName}</div>
                  <div className="text-sm text-blue-100 mt-1">
                    {monthPresences.filter((p) => p.presence === 'present').length} present,{' '}
                    {monthPresences.filter((p) => p.presence === 'absent').length} absent
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {monthPresences.map((presence) => (
                    <div key={presence.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {presence.studentPlanning?.course?.title || 'Course'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {presence.studentPlanning?.date_day
                              ? new Date(presence.studentPlanning.date_day).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Date not available'}
                            {presence.studentPlanning?.hour_start && (
                              <span className="ml-2">at {presence.studentPlanning.hour_start}</span>
                            )}
                          </div>
                          {presence.remarks && (
                            <div className="text-sm text-gray-500 mt-2 italic">
                              "{presence.remarks}"
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              presence.presence === 'present'
                                ? 'bg-green-100 text-green-800'
                                : presence.presence === 'absent'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {presence.presence === 'present'
                              ? 'Present'
                              : presence.presence === 'absent'
                              ? 'Absent'
                              : 'Late'}
                          </div>
                          {presence.note !== -1 && presence.note !== null && (
                            <div className="text-center mt-2">
                              <div className="text-lg font-bold text-gray-900">{presence.note}</div>
                              <div className="text-xs text-gray-500">Grade</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentAttendancePage;

