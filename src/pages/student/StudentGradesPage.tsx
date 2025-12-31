import React, { useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudentByEmail } from '../../hooks/useStudentByEmail';
import { useStudentPresences } from '../../hooks/useStudentPresence';
import { useCourses } from '../../hooks/useCourses';

const StudentGradesPage: React.FC = () => {
  const { user } = useAuth();
  const { data: studentByEmail, isLoading: loadingStudent } = useStudentByEmail(user?.email);
  const studentId = studentByEmail?.id;

  const { data: presenceData, isLoading: loadingPresence } = useStudentPresences({
    student_id: studentId,
    limit: 100,
  });

  // Fetch all courses to use as fallback for course names
  const { data: coursesData } = useCourses({ page: 1, limit: 200 });
  const coursesMap = useMemo(() => {
    const map = new Map<number, string>();
    coursesData?.data?.forEach((course) => {
      if (course.id && course.title) {
        map.set(course.id, course.title);
      }
    });
    return map;
  }, [coursesData]);

  if (loadingStudent || loadingPresence) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your grades...</div>
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

  const presences = presenceData?.data || [];

  // Group by course
  const gradesByCourse: Record<string, { course: string; grades: typeof presences; average: number }> = {};
  
  presences.forEach((presence) => {
    // Try to get course name from multiple sources
    let courseName = presence.studentPlanning?.course?.title;
    
    // Fallback: use course_id to lookup course name
    if (!courseName && presence.studentPlanning?.course_id) {
      courseName = coursesMap.get(presence.studentPlanning.course_id) || undefined;
    }
    
    // Final fallback
    if (!courseName) {
      courseName = presence.studentPlanning?.course_id 
        ? `Course #${presence.studentPlanning.course_id}`
        : 'Unknown Course';
    }
    
    if (!gradesByCourse[courseName]) {
      gradesByCourse[courseName] = {
        course: courseName,
        grades: [],
        average: 0,
      };
    }
    if (presence.note !== -1 && presence.note !== null) {
      gradesByCourse[courseName].grades.push(presence);
    }
  });

  // Calculate averages
  Object.keys(gradesByCourse).forEach((courseName) => {
    const courseData = gradesByCourse[courseName];
    const validGrades = courseData.grades.filter((g) => g.note !== -1 && g.note !== null);
    if (validGrades.length > 0) {
      const sum = validGrades.reduce((acc, g) => acc + (g.note || 0), 0);
      courseData.average = sum / validGrades.length;
    }
  });

  const courses = Object.values(gradesByCourse);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Grades</h2>
        <p className="text-gray-600">View your grades and performance by course</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">No grades available yet</div>
          <p className="text-sm text-gray-400">Your grades will appear here once they are recorded.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((courseData) => (
            <div key={courseData.course} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">{courseData.course}</div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100">Average</div>
                    <div className="text-2xl font-bold">
                      {courseData.average.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {courseData.grades
                  .filter((g) => g.note !== -1 && g.note !== null)
                  .map((grade) => (
                    <div key={grade.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {grade.studentPlanning?.date_day
                              ? new Date(grade.studentPlanning.date_day).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Date not available'}
                          </div>
                          {grade.remarks && (
                            <div className="text-sm text-gray-600 mt-1">{grade.remarks}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-2xl font-bold ${
                            (grade.note || 0) >= 10
                              ? 'text-green-600'
                              : (grade.note || 0) >= 7
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {grade.note !== null && grade.note !== -1 ? grade.note.toFixed(2) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {grade.presence === 'present' ? 'Present' : grade.presence === 'absent' ? 'Absent' : 'Late'}
                          </div>
                        </div>
                      </div>
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

export default StudentGradesPage;

