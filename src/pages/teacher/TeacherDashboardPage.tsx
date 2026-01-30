import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTeacherByEmail } from '../../hooks/useTeacherByEmail';
import { usePlanningStudents } from '../../hooks/usePlanningStudents';
import { getFileUrl } from '../../utils/apiConfig';
import { Link } from 'react-router-dom';

const TeacherDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data: teacherByEmail, isLoading: loadingTeacher } = useTeacherByEmail(user?.email);
  const teacherId = teacherByEmail?.id;

  // Get today's plannings
  const today = new Date().toISOString().split('T')[0];
  const { data: todayPlannings, isLoading: loadingPlannings } = usePlanningStudents({
    teacher_id: teacherId,
    date_day: today,
    order: 'ASC',
    limit: 10,
  });

  // Get upcoming plannings (next 7 days)
  const { data: upcomingPlannings } = usePlanningStudents({
    teacher_id: teacherId,
    order: 'ASC',
    limit: 20,
  });

  if (loadingTeacher || loadingPlannings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your dashboard...</div>
      </div>
    );
  }

  if (!teacherId || !teacherByEmail) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">Teacher profile not found</div>
        <p className="text-sm text-gray-400">
          Please contact your administrator to set up your teacher account.
        </p>
      </div>
    );
  }

  const todaySessions = todayPlannings?.data || [];
  const upcomingSessions = upcomingPlannings?.data || [];

  return (
    <div className="space-y-6">
      {/* Teacher Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {teacherByEmail.first_name} {teacherByEmail.last_name}
            </h2>
            <p className="text-blue-100">{teacherByEmail.email}</p>
          </div>
          {teacherByEmail.picture && (
            <img
              src={getFileUrl(teacherByEmail.picture)}
              alt={`${teacherByEmail.first_name} ${teacherByEmail.last_name}`}
              className="w-20 h-20 rounded-full border-4 border-white/30 object-cover"
            />
          )}
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
        {todaySessions.length === 0 ? (
          <p className="text-gray-500">No classes scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todaySessions.map((planning) => (
              <div
                key={planning.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {planning.course?.title || `Course #${planning.course_id}`}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {planning.class?.title || `Class #${planning.class_id}`} •{' '}
                    {planning.classRoom?.title || `Room #${planning.class_room_id}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {planning.hour_start} - {planning.hour_end}
                  </div>
                </div>
                <Link
                  to={`/teacher/attendance?planning=${planning.id}`}
                  className="ml-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                >
                  Manage
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip: Attendance via Schedule */}
      <div className="rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0" aria-hidden>📅✓</span>
        <div>
          <p className="font-medium text-gray-900">Attendance is in your Schedule</p>
          <p className="text-sm text-gray-600 mt-1">
            Open your <Link to="/teacher/plannings" className="text-primary font-medium hover:underline">Schedule</Link>, then tap any session to mark attendance for that class. One place for your week and your presence list.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/teacher/plannings"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-semibold text-gray-900 mb-1">View Schedule</h3>
          <p className="text-sm text-gray-600">See your week and mark attendance from any session</p>
        </Link>
        <Link
          to="/teacher/grades"
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="text-3xl mb-2">📝</div>
          <h3 className="font-semibold text-gray-900 mb-1">Assign Grades</h3>
          <p className="text-sm text-gray-600">Give notes to students</p>
        </Link>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Sessions</h3>
          <div className="space-y-2">
            {upcomingSessions.slice(0, 5).map((planning) => (
              <div
                key={planning.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {planning.course?.title || `Course #${planning.course_id}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {planning.date_day} • {planning.hour_start} - {planning.hour_end}
                  </div>
                </div>
                <Link
                  to={`/teacher/attendance?planning=${planning.id}`}
                  className="text-secondary hover:text-secondary/80 text-sm font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
          {upcomingSessions.length > 5 && (
            <Link
              to="/teacher/plannings"
              className="mt-4 block text-center text-primary hover:text-primary-dark text-sm font-medium"
            >
              View all sessions →
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardPage;

